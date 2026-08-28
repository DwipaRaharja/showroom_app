<?php

namespace App\Http\Requests\Car;

use App\Models\Brand;
use App\Models\Car;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCarRequest extends FormRequest
{
    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        $licensePlate = null;

        if ($this->filled('plate_prefix') || $this->filled('plate_number')) {
            $prefix = strtoupper(trim((string) $this->input('plate_prefix')));
            $number = trim((string) $this->input('plate_number'));
            $suffix = strtoupper(trim((string) $this->input('plate_suffix')));

            $combined = trim("{$prefix} {$number}".($suffix !== '' ? " {$suffix}" : ''));
            $licensePlate = $combined !== '' ? $combined : null;
        } elseif ($this->input('license_plate')) {
            $normalized = preg_replace('/\s+/', ' ', strtoupper(trim((string) $this->input('license_plate'))));
            $licensePlate = $normalized !== '' ? $normalized : null;
        }

        $capital = (array) $this->input('capital', []);
        $capitalStatus = (string) ($capital['status'] ?? 'completed');
        $isDraft = $capitalStatus === 'draft';
        $capitalNotes = trim((string) ($capital['notes'] ?? ''));

        $sellingPrice = $this->input('selling_price');
        if ($isDraft && ($sellingPrice === null || $sellingPrice === '')) {
            $sellingPrice = 0;
        }

        $purchaseDate = $capital['purchase_date'] ?? null;
        if ($isDraft && ($purchaseDate === null || $purchaseDate === '')) {
            $purchaseDate = now()->toDateString();
        }

        $capitalPrice = $capital['price'] ?? null;
        if ($isDraft && ($capitalPrice === null || $capitalPrice === '')) {
            $capitalPrice = 0;
        }

        $this->merge([
            'name' => trim((string) $this->input('name')),
            'selling_price' => $sellingPrice,
            'license_plate' => $licensePlate,
            'chassis_number' => $this->input('chassis_number') ? strtoupper(trim((string) $this->input('chassis_number'))) : null,
            'engine_number' => $this->input('engine_number') ? strtoupper(trim((string) $this->input('engine_number'))) : null,
            'color' => $this->input('color') ? trim((string) $this->input('color')) : null,
            'description' => $this->input('description') ? trim((string) $this->input('description')) : null,
            'capital' => [
                'purchase_date' => $purchaseDate,
                'price' => $capitalPrice,
                'repair_cost' => $capital['repair_cost'] ?? 0,
                'transport_cost' => $capital['transport_cost'] ?? 0,
                'other_cost' => $capital['other_cost'] ?? 0,
                'status' => $capitalStatus,
                'notes' => $capitalNotes === '' ? null : $capitalNotes,
            ],
        ]);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, array<mixed>>
     */
    public function rules(): array
    {
        $car = $this->route('car');
        $hasActiveSale = $car instanceof Car && ($car->sale()->exists() || in_array($car->status, ['booked', 'sold'], true));
        $allowedStatuses = $hasActiveSale ? [$car->status] : ['available', 'maintenance'];
        $isCompleted = $this->input('capital.status') === 'completed';

        return [
            'brand_id' => [
                'required',
                Rule::exists(Brand::class, 'id'),
            ],
            'name' => [
                'required',
                'string',
                'max:255',
            ],
            'license_plate' => [
                'nullable',
                'string',
                'max:20',
                'regex:/^[A-Z]{1,2}\s\d{1,4}(\s[A-Z]{1,3})?$/',
                Rule::unique(Car::class, 'license_plate')->ignore($car),
            ],
            'chassis_number' => [
                'nullable',
                'string',
                'max:50',
                Rule::unique(Car::class, 'chassis_number')->ignore($car),
            ],
            'engine_number' => [
                'nullable',
                'string',
                'max:50',
                Rule::unique(Car::class, 'engine_number')->ignore($car),
            ],
            'year' => [
                'required',
                'integer',
                'min:1990',
                'max:'.(date('Y') + 1),
            ],
            'color' => [
                'nullable',
                'string',
                'max:50',
            ],
            'transmission' => [
                'required',
                Rule::in(['manual', 'automatic', 'cvt']),
            ],
            'fuel_type' => [
                'required',
                Rule::in(['bensin', 'diesel', 'hybrid', 'electric']),
            ],
            'mileage' => [
                'required',
                'integer',
                'min:0',
            ],
            'selling_price' => [
                'required',
                'numeric',
                $isCompleted ? 'min:1' : 'min:0',
            ],
            'status' => [
                'required',
                Rule::in($allowedStatuses),
            ],
            'description' => [
                'nullable',
                'string',
            ],
            'image' => [
                'nullable',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:5120',
            ],
            'remove_image' => [
                'nullable',
                'boolean',
            ],
            'capital' => ['required', 'array'],
            'capital.purchase_date' => ['required', 'date'],
            'capital.price' => [
                'required',
                'integer',
                $isCompleted ? 'min:1' : 'min:0',
            ],
            'capital.repair_cost' => ['required', 'integer', 'min:0'],
            'capital.transport_cost' => ['required', 'integer', 'min:0'],
            'capital.other_cost' => ['required', 'integer', 'min:0'],
            'capital.status' => [
                'required',
                Rule::in(['draft', 'completed', 'cancelled']),
            ],
            'capital.notes' => ['nullable', 'string', 'max:2000'],
        ];
    }

    /**
     * Get custom validation attribute names.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'brand_id' => 'merek',
            'name' => 'nama / model mobil',
            'license_plate' => 'plat nomor',
            'chassis_number' => 'nomor rangka',
            'engine_number' => 'nomor mesin',
            'year' => 'tahun',
            'color' => 'warna',
            'transmission' => 'transmisi',
            'fuel_type' => 'bahan bakar',
            'mileage' => 'kilometer / jarak tempuh',
            'selling_price' => 'harga jual',
            'status' => 'status',
            'description' => 'deskripsi / catatan',
            'image' => 'gambar kendaraan',
            'capital.purchase_date' => 'tanggal perolehan',
            'capital.price' => 'harga perolehan',
            'capital.repair_cost' => 'biaya perbaikan',
            'capital.transport_cost' => 'biaya transportasi',
            'capital.other_cost' => 'biaya lainnya',
            'capital.status' => 'status modal',
            'capital.notes' => 'catatan modal',
        ];
    }

    /**
     * Get custom error messages for validation rules.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        $car = $this->route('car');
        $hasActiveSale = $car instanceof Car && ($car->sale()->exists() || in_array($car->status, ['booked', 'sold'], true));

        return [
            'license_plate.regex' => 'Format plat nomor tidak valid (contoh: B 1234 ABC atau DK 8888 XY).',
            'status.in' => $hasActiveSale
                ? 'Status mobil yang terikat transaksi penjualan tidak dapat diubah secara manual.'
                : 'Perubahan status mobil hanya diizinkan untuk status Tersedia atau Perbaikan.',
            'selling_price.min' => 'Harga jual harus lebih dari Rp 0 ketika status modal Aktif.',
            'capital.price.min' => 'Harga perolehan modal harus lebih dari Rp 0 ketika status modal Aktif.',
        ];
    }
}

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

        $this->merge([
            'name' => trim((string) $this->input('name')),
            'license_plate' => $licensePlate,
            'chassis_number' => $this->input('chassis_number') ? strtoupper(trim((string) $this->input('chassis_number'))) : null,
            'engine_number' => $this->input('engine_number') ? strtoupper(trim((string) $this->input('engine_number'))) : null,
            'color' => $this->input('color') ? trim((string) $this->input('color')) : null,
            'description' => $this->input('description') ? trim((string) $this->input('description')) : null,
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
            'purchase_price' => [
                'nullable',
                'numeric',
                'min:0',
            ],
            'selling_price' => [
                'required',
                'numeric',
                'min:0',
            ],
            'status' => [
                'required',
                Rule::in(['available', 'booked', 'sold', 'maintenance']),
            ],
            'description' => [
                'nullable',
                'string',
            ],
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
            'purchase_price' => 'harga beli',
            'selling_price' => 'harga jual',
            'status' => 'status',
            'description' => 'deskripsi / catatan',
        ];
    }

    /**
     * Get custom error messages for validation rules.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'license_plate.regex' => 'Format plat nomor tidak valid (contoh: B 1234 ABC atau DK 8888 XY).',
        ];
    }
}

<?php

declare(strict_types=1);

namespace App\Http\Requests\Handover;

use App\Models\Sale;
use App\Models\VehicleHandoverItem;
use Carbon\Carbon;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreHandoverRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<mixed>> */
    public function rules(): array
    {
        return [
            'sale_id' => ['required', Rule::exists(Sale::class, 'id')],
            'occurred_at' => ['required', 'date', 'before_or_equal:now'],
            'items' => ['required', 'array', 'min:1'],
            'items.*' => [
                'required',
                'distinct',
                Rule::in(array_keys(VehicleHandoverItem::LABELS)),
            ],
            'key_count' => ['nullable', 'integer', 'between:1,3'],
            'other_item_name' => ['nullable', 'string', 'max:100'],
            'recipient_name' => ['required', 'string', 'max:100'],
            'recipient_phone' => ['nullable', 'string', 'max:30'],
            'recipient_id_card' => ['nullable', 'digits:16'],
            'recipient_relation' => [
                'required',
                Rule::in([
                    'buyer_self',
                    'family',
                    'driver',
                    'leasing_officer',
                    'other',
                ]),
            ],
            'officer_name' => ['required', 'string', 'max:100'],
            'handover_location' => ['required', 'string', 'max:100'],
            'handover_address' => ['nullable', 'string', 'max:500'],
            'vehicle_condition' => ['nullable', 'array'],
            'vehicle_condition.fuel_level' => [
                'nullable',
                Rule::in(['Full', '3/4', '1/2', '1/4', 'Reserve']),
            ],
            'vehicle_condition.cleanliness' => [
                'nullable',
                Rule::in([
                    'Bersih & Salon Siap Pakai',
                    'Standar Bersih Cuci',
                    'Apa Adanya',
                ]),
            ],
            'notes' => ['nullable', 'string', 'max:1000'],
            'photos' => ['required', 'array', 'min:1', 'max:5'],
            'photos.*' => [
                'required',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:5120',
            ],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if ($validator->errors()->any()) {
                return;
            }

            /** @var Sale|null $sale */
            $sale = Sale::query()
                ->with(['payments', 'handover.events.items'])
                ->find($this->integer('sale_id'));

            if ($sale === null) {
                return;
            }

            if ($sale->status === 'cancelled') {
                $validator->errors()->add(
                    'sale_id',
                    'Penjualan yang dibatalkan tidak dapat memiliki tracking penyerahan.',
                );

                return;
            }

            /** @var array<int, string> $items */
            $items = array_values(array_unique($this->input('items', [])));
            $handover = $sale->handover;
            $repeatableItems = ['other'];
            $alreadyDelivered = collect($items)
                ->reject(fn (string $item): bool => in_array($item, $repeatableItems, true))
                ->filter(fn (string $item): bool => $handover?->hasDeliveredItem($item) ?? false)
                ->map(fn (string $item): string => VehicleHandoverItem::LABELS[$item])
                ->values();

            if ($alreadyDelivered->isNotEmpty()) {
                $validator->errors()->add(
                    'items',
                    'Item berikut sudah pernah diserahkan: '.$alreadyDelivered->join(', ').'.',
                );
            }

            if (in_array('keys', $items, true) && ! $this->filled('key_count')) {
                $validator->errors()->add(
                    'key_count',
                    'Masukkan jumlah kunci yang diserahkan.',
                );
            }

            if (in_array('other', $items, true) && ! $this->filled('other_item_name')) {
                $validator->errors()->add(
                    'other_item_name',
                    'Tuliskan nama barang lainnya yang diserahkan.',
                );
            }

            if (in_array('vehicle', $items, true) && $sale->remaining_bill > 10_000_000) {
                $validator->errors()->add(
                    'items',
                    'Unit belum dapat diserahkan karena sisa tagihan masih '.
                    'Rp '.number_format($sale->remaining_bill, 0, ',', '.').'.',
                );
            }

            $containsOriginalLegalDocument = collect(['bpkb', 'invoice'])
                ->contains(fn (string $item): bool => in_array($item, $items, true));

            if ($containsOriginalLegalDocument && $sale->remaining_bill > 0) {
                $validator->errors()->add(
                    'items',
                    'BPKB dan faktur asli hanya dapat diserahkan setelah transaksi lunas.',
                );
            }

            $hasVehicleDelivery = in_array('vehicle', $items, true)
                || ($handover?->hasDeliveredItem('vehicle') ?? false);

            if (in_array('bpkb', $items, true) && ! $hasVehicleDelivery) {
                $validator->errors()->add(
                    'items',
                    'Catat penyerahan unit terlebih dahulu sebelum menyerahkan BPKB.',
                );
            }

            $hasInvoice = in_array('invoice', $items, true)
                || ($handover?->hasDeliveredItem('invoice') ?? false);

            if (in_array('bpkb', $items, true) && ! $hasInvoice) {
                $validator->errors()->add(
                    'items',
                    'Faktur kendaraan harus ikut diserahkan bersama BPKB.',
                );
            }

            if (in_array('bpkb', $items, true)) {
                $unitEvent = $handover?->eventForItem('vehicle');
                $occurredAt = Carbon::parse((string) $this->input('occurred_at'));

                if ($unitEvent !== null && $occurredAt->lt($unitEvent->occurred_at)) {
                    $validator->errors()->add(
                        'occurred_at',
                        'Waktu penyerahan BPKB tidak boleh lebih awal dari penyerahan unit.',
                    );
                }
            }
        });
    }

    /** @return array<string, string> */
    public function attributes(): array
    {
        return [
            'sale_id' => 'transaksi penjualan',
            'occurred_at' => 'tanggal dan waktu kejadian',
            'items' => 'barang yang diserahkan',
            'items.*' => 'barang yang diserahkan',
            'key_count' => 'jumlah kunci',
            'other_item_name' => 'nama barang lainnya',
            'recipient_name' => 'nama penerima',
            'recipient_phone' => 'nomor HP penerima',
            'recipient_id_card' => 'NIK penerima',
            'recipient_relation' => 'hubungan penerima',
            'officer_name' => 'petugas penyerahan',
            'handover_location' => 'lokasi penyerahan',
            'handover_address' => 'alamat penyerahan',
            'vehicle_condition.fuel_level' => 'level bahan bakar',
            'vehicle_condition.cleanliness' => 'kebersihan unit',
            'notes' => 'catatan tracking',
            'photos' => 'foto bukti',
            'photos.*' => 'foto bukti',
        ];
    }
}

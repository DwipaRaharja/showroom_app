<?php

declare(strict_types=1);

namespace App\Http\Requests\Handover;

use App\Models\Sale;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreHandoverRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, array<mixed>>
     */
    public function rules(): array
    {
        return [
            'sale_id' => [
                'required',
                Rule::exists(Sale::class, 'id'),
            ],
            'recipient_name' => [
                'required',
                'string',
                'max:100',
            ],
            'recipient_phone' => [
                'nullable',
                'string',
                'max:30',
            ],
            'recipient_id_card' => [
                'nullable',
                'string',
                'max:50',
            ],
            'recipient_relation' => [
                'required',
                Rule::in(['buyer_self', 'family', 'driver', 'leasing_officer', 'other']),
            ],
            'officer_name' => [
                'required',
                'string',
                'max:100',
            ],
            'handover_location' => [
                'required',
                'string',
                'max:100',
            ],
            'handover_address' => [
                'nullable',
                'string',
                'max:500',
            ],
            'vehicle_delivered_at' => [
                'nullable',
                'date',
            ],
            'bpkb_delivered_at' => [
                'nullable',
                'date',
            ],
            'bpkb_recipient_type' => [
                'nullable',
                Rule::in(['customer', 'finance_company']),
            ],
            'checklist' => [
                'nullable',
                'array',
            ],
            'notes' => [
                'nullable',
                'string',
                'max:1000',
            ],
        ];
    }

    /**
     * Configure the validator instance with business rule validations.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v): void {
            $saleId = $this->input('sale_id');
            if (! $saleId) {
                return;
            }

            /** @var Sale|null $sale */
            $sale = Sale::query()->with('payments')->find($saleId);
            if (! $sale) {
                return;
            }

            $hasVehicleDelivery = ! empty($this->input('vehicle_delivered_at'));
            $hasBpkbDelivery = ! empty($this->input('bpkb_delivered_at'));

            // Rule 1: Vehicle Delivery requires remaining_bill <= 10_000_000
            if ($hasVehicleDelivery && $sale->remaining_bill > 10_000_000) {
                $formattedRemaining = number_format($sale->remaining_bill, 0, ',', '.');
                $v->errors()->add(
                    'vehicle_delivered_at',
                    "Kendaraan & STNK belum dapat diserahkan karena sisa tagihan (Rp {$formattedRemaining}) masih lebih dari Rp 10.000.000. Minimal pembayaran harus mencakup hingga sisa maksimal Rp 10 Juta."
                );
            }

            // Rule 2: BPKB Delivery requires remaining_bill == 0 (100% Lunas)
            if ($hasBpkbDelivery && $sale->remaining_bill > 0) {
                $formattedRemaining = number_format($sale->remaining_bill, 0, ',', '.');
                $v->errors()->add(
                    'bpkb_delivered_at',
                    "BPKB & dokumen legalitas asli hanya boleh diserahkan jika transaksi SUDAH LUNAS 100% (Sisa tagihan saat ini: Rp {$formattedRemaining})."
                );
            }
        });
    }

    /**
     * Custom attribute names.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'sale_id' => 'transaksi penjualan',
            'recipient_name' => 'nama penerima',
            'recipient_phone' => 'no. hp penerima',
            'recipient_id_card' => 'NIK KTP penerima',
            'recipient_relation' => 'hubungan penerima',
            'officer_name' => 'petugas penyerahan',
            'handover_location' => 'lokasi penyerahan',
            'handover_address' => 'alamat penyerahan',
            'vehicle_delivered_at' => 'waktu penyerahan unit & STNK',
            'bpkb_delivered_at' => 'waktu penyerahan BPKB',
            'bpkb_recipient_type' => 'penerima BPKB',
            'checklist' => 'checklist kelengkapan',
            'notes' => 'catatan serah terima',
        ];
    }
}

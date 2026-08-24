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
                'digits:16',
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
                'before_or_equal:now',
            ],
            'bpkb_delivered_at' => [
                'nullable',
                'date',
                'before_or_equal:now',
            ],
            'bpkb_recipient_type' => [
                'nullable',
                Rule::in(['customer', 'finance_company']),
            ],
            'checklist' => [
                'required',
                'array',
            ],
            'checklist.key_count' => ['required', 'integer', 'between:1,3'],
            'checklist.has_stnk' => ['required', 'boolean'],
            'checklist.has_bpkb' => ['required', 'boolean'],
            'checklist.has_faktur' => ['required', 'boolean'],
            'checklist.has_manual_book' => ['required', 'boolean'],
            'checklist.has_toolkit' => ['required', 'boolean'],
            'checklist.has_spare_tire' => ['required', 'boolean'],
            'checklist.fuel_level' => [
                'required',
                Rule::in(['Full', '3/4', '1/2', '1/4', 'Reserve']),
            ],
            'checklist.cleanliness' => [
                'required',
                Rule::in([
                    'Bersih & Salon Siap Pakai',
                    'Standar Bersih Cuci',
                    'Apa Adanya',
                ]),
            ],
            'notes' => [
                'nullable',
                'string',
                'max:1000',
            ],
            'proof_file' => [
                'nullable',
                'file',
                'mimes:jpg,jpeg,png,pdf',
                'max:5120',
            ],
        ];
    }

    /**
     * Configure the validator instance with business rule validations.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v): void {
            if ($v->errors()->any()) {
                return;
            }

            $saleId = $this->input('sale_id');
            if (! $saleId) {
                return;
            }

            /** @var Sale|null $sale */
            $sale = Sale::query()->with(['payments', 'handover'])->find($saleId);
            if (! $sale) {
                return;
            }

            if ($sale->status === 'cancelled') {
                $v->errors()->add(
                    'sale_id',
                    'Penjualan yang dibatalkan tidak dapat diproses serah terimanya.'
                );

                return;
            }

            $vehicleDeliveredAt = $this->date('vehicle_delivered_at')
                ?? $sale->handover?->vehicle_delivered_at;
            $bpkbDeliveredAt = $this->date('bpkb_delivered_at')
                ?? $sale->handover?->bpkb_delivered_at;
            $hasVehicleDelivery = $vehicleDeliveredAt !== null;
            $hasBpkbDelivery = $bpkbDeliveredAt !== null;

            if (! $hasVehicleDelivery && ! $hasBpkbDelivery) {
                $v->errors()->add(
                    'vehicle_delivered_at',
                    'Pilih tahap penyerahan unit yang ingin dicatat.'
                );

                return;
            }

            if ($hasVehicleDelivery && $sale->remaining_bill > 10_000_000) {
                $formattedRemaining = number_format($sale->remaining_bill, 0, ',', '.');
                $v->errors()->add(
                    'vehicle_delivered_at',
                    "Unit dan STNK belum dapat diserahkan karena sisa tagihan Rp {$formattedRemaining} masih lebih dari Rp 10.000.000."
                );
            }

            if ($hasBpkbDelivery && $sale->remaining_bill > 0) {
                $formattedRemaining = number_format($sale->remaining_bill, 0, ',', '.');
                $v->errors()->add(
                    'bpkb_delivered_at',
                    "BPKB dan faktur asli hanya dapat diserahkan setelah transaksi lunas. Sisa tagihan saat ini Rp {$formattedRemaining}."
                );
            }

            if ($hasBpkbDelivery && ! $hasVehicleDelivery) {
                $v->errors()->add(
                    'bpkb_delivered_at',
                    'Catat penyerahan unit dan STNK terlebih dahulu sebelum menyerahkan BPKB.'
                );
            }

            if (
                $vehicleDeliveredAt !== null
                && $bpkbDeliveredAt !== null
                && $bpkbDeliveredAt->lt($vehicleDeliveredAt)
            ) {
                $v->errors()->add(
                    'bpkb_delivered_at',
                    'Waktu penyerahan BPKB tidak boleh lebih awal dari penyerahan unit.'
                );
            }

            if ($hasBpkbDelivery && blank($this->input('bpkb_recipient_type'))) {
                $v->errors()->add(
                    'bpkb_recipient_type',
                    'Pilih pihak yang menerima BPKB.'
                );
            }

            if ($hasBpkbDelivery && ! $this->boolean('checklist.has_bpkb')) {
                $v->errors()->add(
                    'checklist.has_bpkb',
                    'Konfirmasi bahwa BPKB asli ikut diserahkan.'
                );
            }

            if ($hasBpkbDelivery && ! $this->boolean('checklist.has_faktur')) {
                $v->errors()->add(
                    'checklist.has_faktur',
                    'Konfirmasi bahwa faktur asli ikut diserahkan.'
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
            'checklist.key_count' => 'jumlah kunci',
            'checklist.has_stnk' => 'STNK asli',
            'checklist.has_bpkb' => 'BPKB asli',
            'checklist.has_faktur' => 'faktur asli',
            'checklist.has_manual_book' => 'buku manual / servis',
            'checklist.has_toolkit' => 'tool kit dan dongkrak',
            'checklist.has_spare_tire' => 'ban cadangan',
            'checklist.fuel_level' => 'level bahan bakar',
            'checklist.cleanliness' => 'kondisi kebersihan',
            'notes' => 'catatan serah terima',
            'proof_file' => 'bukti serah terima',
        ];
    }
}

<?php

namespace App\Http\Requests\Payment;

use App\Models\Sale;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StorePaymentRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, array<mixed>>
     */
    public function rules(): array
    {
        return [
            'payment_date' => [
                'required',
                'date',
            ],
            'payer_type' => [
                'required',
                Rule::in(['customer', 'finance']),
            ],
            'payment_category' => [
                'required',
                Rule::in([
                    'down_payment',
                    'settlement',
                    'installment',
                    'finance_disbursement',
                    'leasing_bonus',
                    'other',
                ]),
            ],
            'amount' => [
                'required',
                'integer',
                'min:1',
            ],
            'payment_method' => [
                'required',
                Rule::in(['transfer', 'cash', 'qris', 'giro']),
            ],
            'destination_account' => [
                'required',
                'string',
                'max:100',
            ],
            'reference_number' => [
                'nullable',
                'string',
                'max:100',
            ],
            'notes' => [
                'nullable',
                'string',
            ],
        ];
    }

    /**
     * Validate payment rules that depend on the current sale balance.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if ($validator->errors()->any()) {
                return;
            }

            $sale = $this->route('sale');

            if (! $sale instanceof Sale) {
                return;
            }

            $sale->loadMissing('payments');

            $category = (string) $this->input('payment_category');
            $amount = (int) $this->input('amount');
            $isBonus = $category === 'leasing_bonus';

            if ($sale->status === 'cancelled') {
                $validator->errors()->add(
                    'payment_category',
                    'Penjualan yang dibatalkan tidak dapat menerima pembayaran.'
                );

                return;
            }

            if ($category === 'finance_disbursement') {
                $validator->errors()->add(
                    'payment_category',
                    'Pencairan pokok leasing dicatat otomatis saat BPKB diserahkan kepada petugas leasing.'
                );

                return;
            }

            if ($category === 'down_payment' && $sale->has_down_payment) {
                $validator->errors()->add(
                    'payment_category',
                    'Pembayaran DP / booking sudah pernah dicatat untuk penjualan ini.'
                );
            }

            if (
                $category === 'installment'
                && $sale->payment_type === 'cash_tempo'
                && ! $sale->has_down_payment
            ) {
                $validator->errors()->add(
                    'payment_category',
                    'Catat pembayaran DP / booking terlebih dahulu sebelum menambahkan angsuran.'
                );
            }

            if (
                in_array($category, ['finance_disbursement', 'leasing_bonus'], true)
                && $sale->payment_type !== 'credit'
            ) {
                $validator->errors()->add(
                    'payment_category',
                    'Kategori pembayaran leasing hanya tersedia untuk penjualan kredit.'
                );
            }

            if ($category === 'down_payment' && $sale->payment_type === 'cash_full') {
                $validator->errors()->add(
                    'payment_category',
                    'Penjualan tunai lunas tidak dapat menerima pembayaran DP / booking.'
                );
            }

            $remaining = $isBonus
                ? max(0, $sale->leasing_bonus - $sale->total_bonus_paid)
                : ($sale->payment_type === 'credit'
                    ? $sale->customer_payment_shortfall
                    : $sale->remaining_bill);

            if ($remaining <= 0) {
                $validator->errors()->add(
                    'amount',
                    $isBonus
                        ? 'Bonus leasing sudah diterima seluruhnya.'
                        : ($sale->payment_type === 'credit'
                            ? 'Kewajiban pembayaran customer sudah terpenuhi. Pokok leasing akan dicatat otomatis saat BPKB diserahkan.'
                            : 'Penjualan ini sudah lunas dan tidak dapat menerima pembayaran lagi.')
                );

                return;
            }

            if ($amount > $remaining) {
                $validator->errors()->add(
                    'amount',
                    'Nominal pembayaran tidak boleh melebihi '.
                    ($sale->payment_type === 'credit' && ! $isBonus
                        ? 'kekurangan customer'
                        : 'sisa tagihan').
                    ' sebesar Rp '.number_format($remaining, 0, ',', '.').'.'
                );
            }
        });
    }

    /**
     * Get custom attributes for validator errors.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'payment_date' => 'tanggal pembayaran',
            'payer_type' => 'sumber pembayar',
            'payment_category' => 'kategori pembayaran',
            'amount' => 'nominal uang masuk',
            'payment_method' => 'metode pembayaran',
            'destination_account' => 'rekening / kas tujuan',
            'reference_number' => 'nomor referensi',
            'notes' => 'catatan pembayaran',
        ];
    }
}

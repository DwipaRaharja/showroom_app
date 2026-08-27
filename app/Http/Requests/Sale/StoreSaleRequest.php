<?php

namespace App\Http\Requests\Sale;

use App\Models\Car;
use App\Models\Customer;
use App\Models\FinanceCompany;
use App\Models\Sale;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSaleRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, array<mixed>>
     */
    public function rules(): array
    {
        return [
            'car_id' => [
                'required',
                Rule::exists(Car::class, 'id')->whereNull('deleted_at'),
                Rule::unique(Sale::class, 'car_id'),
                function (string $attribute, mixed $value, \Closure $fail): void {
                    $isEligible = Car::query()
                        ->whereKey($value)
                        ->availableForSale()
                        ->exists();

                    if (! $isEligible) {
                        $fail('Unit mobil harus berstatus tersedia dan belum memiliki transaksi penjualan.');
                    }
                },
            ],
            'customer_id' => [
                'required',
                Rule::exists(Customer::class, 'id'),
            ],
            'payment_type' => [
                'required',
                Rule::in(['cash_full', 'cash_tempo', 'credit', 'trade_in']),
            ],
            'deal_price' => [
                'required',
                'numeric',
                'min:0',
            ],
            'down_payment' => [
                'nullable',
                'numeric',
                'min:0',
                'lte:deal_price',
            ],
            'finance_company_id' => [
                'nullable',
                Rule::requiredIf($this->input('payment_type') === 'credit'),
                Rule::exists(FinanceCompany::class, 'id')
                    ->where('is_active', true),
            ],
            'finance_amount' => [
                'nullable',
                'numeric',
                'min:0',
                'lte:deal_price',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    if (
                        $this->input('payment_type') === 'credit'
                        && (int) $this->input('down_payment', 0) + (int) $value
                            > (int) $this->input('deal_price', 0)
                    ) {
                        $fail('Jumlah DP dan pokok leasing tidak boleh melebihi harga deal.');
                    }
                },
            ],
            'disbursement_estimated_date' => [
                'nullable',
                'date',
            ],
            'leasing_bonus' => [
                'nullable',
                'numeric',
                'min:0',
            ],
            'due_date' => [
                'nullable',
                'date',
            ],
            'trade_in_license_plate' => [
                'nullable',
                Rule::requiredIf($this->input('payment_type') === 'trade_in'),
                'string',
                'max:20',
            ],
            'trade_in_brand' => [
                'nullable',
                Rule::requiredIf($this->input('payment_type') === 'trade_in'),
                'string',
                'max:100',
            ],
            'trade_in_car_name' => [
                'nullable',
                Rule::requiredIf($this->input('payment_type') === 'trade_in'),
                'string',
                'max:150',
            ],
            'trade_in_year' => [
                'nullable',
                Rule::requiredIf($this->input('payment_type') === 'trade_in'),
                'integer',
                'min:1900',
                'max:'.(date('Y') + 1),
            ],
            'trade_in_color' => [
                'nullable',
                Rule::requiredIf($this->input('payment_type') === 'trade_in'),
                'string',
                'max:50',
            ],
            'trade_in_mileage' => [
                'nullable',
                Rule::requiredIf($this->input('payment_type') === 'trade_in'),
                'integer',
                'min:0',
            ],
            'trade_in_notes' => [
                'nullable',
                'string',
            ],
            'notes' => [
                'nullable',
                'string',
            ],
            'record_initial_payment' => [
                'nullable',
                'boolean',
            ],
            'payment_date' => [
                'nullable',
                'date',
            ],
            'payment_method' => [
                'nullable',
                Rule::in(['transfer', 'cash', 'qris', 'giro']),
            ],
            'destination_account' => [
                'nullable',
                'string',
                'max:100',
            ],
            'reference_number' => [
                'nullable',
                'string',
                'max:100',
            ],
        ];
    }

    /**
     * Get custom attributes for validator errors.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'car_id' => 'unit mobil',
            'customer_id' => 'pembeli (customer)',
            'payment_type' => 'skema pembayaran',
            'deal_price' => 'harga kesepakatan deal',
            'down_payment' => 'uang muka (DP)',
            'finance_company_id' => 'lembaga finance / leasing',
            'finance_amount' => 'pokok pencairan leasing',
            'disbursement_estimated_date' => 'estimasi tanggal cair leasing',
            'leasing_bonus' => 'bonus / komisi leasing',
            'due_date' => 'tanggal jatuh tempo pelunasan',
            'trade_in_license_plate' => 'plat nomor mobil tukar tambah',
            'trade_in_brand' => 'merek mobil tukar tambah',
            'trade_in_car_name' => 'nama mobil tukar tambah',
            'trade_in_year' => 'tahun mobil tukar tambah',
            'trade_in_color' => 'warna mobil tukar tambah',
            'trade_in_mileage' => 'kilometer mobil tukar tambah',
            'trade_in_notes' => 'catatan mobil tukar tambah',
            'payment_date' => 'tanggal pembayaran',
            'payment_method' => 'metode pembayaran',
            'destination_account' => 'rekening tujuan penerima',
            'reference_number' => 'nomor referensi transfer',
        ];
    }
}

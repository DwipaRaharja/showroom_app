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
            ],
            'customer_id' => [
                'required',
                Rule::exists(Customer::class, 'id'),
            ],
            'payment_type' => [
                'required',
                Rule::in(['cash_full', 'cash_tempo', 'credit']),
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
            ],
            'finance_company_id' => [
                'nullable',
                Rule::requiredIf($this->input('payment_type') === 'credit'),
                Rule::exists(FinanceCompany::class, 'id'),
            ],
            'finance_amount' => [
                'nullable',
                'numeric',
                'min:0',
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
            'payment_date' => 'tanggal pembayaran',
            'payment_method' => 'metode pembayaran',
            'destination_account' => 'rekening tujuan penerima',
            'reference_number' => 'nomor referensi transfer',
        ];
    }
}

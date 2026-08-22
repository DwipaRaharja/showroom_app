<?php

namespace App\Http\Requests\Purchase;

use App\Models\Car;
use App\Models\Purchase;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

abstract class PurchaseRequest extends FormRequest
{
    /**
     * Normalize purchase data before validation.
     */
    protected function prepareForValidation(): void
    {
        $notes = trim((string) $this->input('notes'));

        $this->merge([
            'repair_cost' => $this->input('repair_cost') ?: 0,
            'transport_cost' => $this->input('transport_cost') ?: 0,
            'other_cost' => $this->input('other_cost') ?: 0,
            'notes' => $notes === '' ? null : $notes,
        ]);
    }

    /**
     * Get the shared purchase validation rules.
     *
     * @return array<string, array<mixed>>
     */
    protected function purchaseRules(?Purchase $purchase = null): array
    {
        return [
            'car_id' => [
                'required',
                Rule::exists(Car::class, 'id')->whereNull('deleted_at'),
                Rule::unique(Purchase::class, 'car_id')->ignore($purchase),
            ],
            'purchase_date' => ['required', 'date'],
            'price' => ['required', 'integer', 'min:0'],
            'repair_cost' => ['required', 'integer', 'min:0'],
            'transport_cost' => ['required', 'integer', 'min:0'],
            'other_cost' => ['required', 'integer', 'min:0'],
            'status' => [
                'required',
                Rule::in(['draft', 'completed', 'cancelled']),
            ],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }

    /**
     * Get custom validation messages.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'car_id.unique' => 'Mobil ini sudah memiliki data modal.',
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
            'car_id' => 'mobil',
            'purchase_date' => 'tanggal pencatatan',
            'price' => 'harga perolehan',
            'repair_cost' => 'biaya perbaikan',
            'transport_cost' => 'biaya transportasi',
            'other_cost' => 'biaya lainnya',
            'status' => 'status modal',
            'notes' => 'catatan',
        ];
    }
}

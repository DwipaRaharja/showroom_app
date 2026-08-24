<?php

declare(strict_types=1);

namespace App\Http\Requests\DocumentProcess;

use App\Models\DocumentProcessCost;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreDocumentProcessCostRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<mixed>> */
    public function rules(): array
    {
        return [
            'cost_type' => [
                'required',
                Rule::in(array_keys(DocumentProcessCost::TYPE_LABELS)),
            ],
            'description' => ['required', 'string', 'max:180'],
            'amount' => ['required', 'integer', 'min:1'],
            'paid_by' => ['required', Rule::in(['showroom', 'customer'])],
            'paid_at' => ['nullable', 'date', 'before_or_equal:today'],
            'receipt' => [
                'nullable',
                'file',
                'mimes:pdf,jpg,jpeg,png,webp',
                'max:5120',
            ],
        ];
    }
}

<?php

namespace App\Http\Requests\DocumentProcess;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateDocumentProcessItemRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        foreach (['recipient_type', 'recipient_name', 'handed_over_at', 'notes'] as $field) {
            if ($this->input($field) === '') {
                $this->merge([$field => null]);
            }
        }
    }

    /** @return array<string, array<mixed>> */
    public function rules(): array
    {
        return [
            'status' => [
                'required',
                Rule::in(['waiting', 'ready', 'processing', 'completed', 'handed_over', 'issue']),
            ],
            'recipient_type' => [
                'nullable',
                Rule::in(['customer', 'finance_company', 'other']),
                'required_if:status,handed_over',
            ],
            'recipient_name' => ['nullable', 'string', 'max:150', 'required_if:status,handed_over'],
            'handed_over_at' => ['nullable', 'date', 'required_if:status,handed_over'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'recipient_type.required_if' => 'Jenis penerima wajib dipilih saat dokumen diserahkan.',
            'recipient_name.required_if' => 'Nama penerima wajib diisi saat dokumen diserahkan.',
            'handed_over_at.required_if' => 'Tanggal penyerahan wajib diisi.',
        ];
    }
}

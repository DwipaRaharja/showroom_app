<?php

namespace App\Http\Requests\DocumentProcess;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreDocumentProcessRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        foreach (['assigned_to', 'estimated_completion_date', 'notes'] as $field) {
            if ($this->input($field) === '') {
                $this->merge([$field => null]);
            }
        }
    }

    /** @return array<string, array<mixed>> */
    public function rules(): array
    {
        return [
            'process_type' => [
                'required',
                Rule::in(['handover', 'name_transfer', 'mutation', 'renewal', 'other']),
            ],
            'assigned_to' => ['nullable', Rule::exists('users', 'id')],
            'started_at' => ['required', 'date'],
            'estimated_completion_date' => ['nullable', 'date', 'after_or_equal:started_at'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }

    /** @return array<string, string> */
    public function attributes(): array
    {
        return [
            'process_type' => 'jenis proses',
            'assigned_to' => 'petugas',
            'started_at' => 'tanggal mulai',
            'estimated_completion_date' => 'estimasi selesai',
            'notes' => 'catatan',
        ];
    }
}

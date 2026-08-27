<?php

declare(strict_types=1);

namespace App\Http\Requests\DocumentProcess;

use Illuminate\Foundation\Http\FormRequest;

class DeleteDocumentProcessRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<mixed>> */
    public function rules(): array
    {
        return [
            'reason' => ['required', 'string', 'max:1000'],
            'process_number' => ['required', 'string', 'max:32'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'reason.required' => 'Alasan penghapusan wajib diisi.',
            'process_number.required' => 'Nomor proses wajib diketik sebagai konfirmasi.',
        ];
    }
}

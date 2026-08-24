<?php

namespace App\Http\Requests\VehicleDocument;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

abstract class VehicleDocumentRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $stnk = (array) $this->input('stnk', []);
        $bpkb = (array) $this->input('bpkb', []);

        $this->merge([
            'stnk' => [
                'status' => $stnk['status'] ?? null,
                'owner_name' => $this->nullableString($stnk['owner_name'] ?? null),
                'issued_at' => $this->nullableString($stnk['issued_at'] ?? null),
                'expires_at' => $this->nullableString($stnk['expires_at'] ?? null),
                'annual_tax_due_at' => $this->nullableString($stnk['annual_tax_due_at'] ?? null),
            ],
            'bpkb' => [
                'status' => $bpkb['status'] ?? null,
                'owner_name' => $this->nullableString($bpkb['owner_name'] ?? null),
                'issued_at' => $this->nullableString($bpkb['issued_at'] ?? null),
            ],
            'remove_file' => $this->boolean('remove_file'),
        ]);
    }

    /** @return array<string, array<mixed>> */
    protected function documentRules(): array
    {
        $stnkIsComplete = $this->input('stnk.status') === 'complete';
        $bpkbHasBeenPrinted = in_array(
            $this->input('bpkb.status'),
            ['ready', 'uncollected'],
            true,
        );

        return [
            'stnk' => ['required', 'array'],
            'stnk.status' => [
                'required',
                Rule::in(['printing', 'complete', 'incomplete']),
            ],
            'stnk.owner_name' => [
                Rule::requiredIf($stnkIsComplete),
                'nullable',
                'string',
                'max:100',
            ],
            'stnk.issued_at' => [
                Rule::requiredIf($stnkIsComplete),
                'nullable',
                'date',
            ],
            'stnk.expires_at' => [
                Rule::requiredIf($stnkIsComplete),
                'nullable',
                'date',
                ...($this->filled('stnk.issued_at')
                    ? ['after_or_equal:stnk.issued_at']
                    : []),
            ],
            'stnk.annual_tax_due_at' => [
                'nullable',
                'date',
            ],
            'bpkb' => ['required', 'array'],
            'bpkb.status' => [
                'required',
                Rule::in(['printing', 'ready', 'uncollected']),
            ],
            'bpkb.owner_name' => [
                Rule::requiredIf($bpkbHasBeenPrinted),
                'nullable',
                'string',
                'max:100',
            ],
            'bpkb.issued_at' => [
                Rule::requiredIf($bpkbHasBeenPrinted),
                'nullable',
                'date',
            ],
            'invoice' => ['required', 'array'],
            'invoice.status' => [
                'required',
                Rule::in(['ready', 'not_ready']),
            ],
            'file' => [
                'nullable',
                'file',
                'mimes:pdf,jpg,jpeg,png',
                'max:5120',
            ],
            'remove_file' => ['sometimes', 'boolean'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'stnk.expires_at.after_or_equal' => 'Masa berlaku STNK tidak boleh sebelum tanggal terbit.',
            'file.mimes' => 'Lampiran harus berupa PDF, JPG, JPEG, atau PNG.',
            'file.max' => 'Ukuran lampiran maksimal 5 MB.',
        ];
    }

    /** @return array<string, string> */
    public function attributes(): array
    {
        return [
            'stnk.status' => 'status STNK',
            'stnk.owner_name' => 'nama pemilik STNK',
            'stnk.issued_at' => 'tanggal terbit STNK',
            'stnk.expires_at' => 'masa berlaku STNK',
            'stnk.annual_tax_due_at' => 'jatuh tempo pajak tahunan',
            'bpkb.status' => 'status BPKB',
            'bpkb.owner_name' => 'nama pemilik BPKB',
            'bpkb.issued_at' => 'tanggal terbit BPKB',
            'invoice.status' => 'status faktur',
            'file' => 'lampiran dokumen',
        ];
    }

    private function nullableString(mixed $value): ?string
    {
        $normalized = trim((string) $value);

        return $normalized === '' ? null : $normalized;
    }
}

<?php

namespace App\Http\Requests\VehicleDocument;

use App\Models\Car;
use App\Models\VehicleDocument;
use Illuminate\Database\Query\Builder as QueryBuilder;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

abstract class VehicleDocumentRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $nullableStrings = [
            'document_number',
            'owner_name',
            'issued_at',
            'expires_at',
            'notes',
        ];

        $normalized = [];

        foreach ($nullableStrings as $field) {
            $value = trim((string) $this->input($field));
            $normalized[$field] = $value === '' ? null : $value;
        }

        $this->merge([
            ...$normalized,
            'original_received' => $this->boolean('original_received'),
            'remove_file' => $this->boolean('remove_file'),
        ]);
    }

    /**
     * @return array<string, array<mixed>>
     */
    protected function documentRules(
        Car $car,
        ?VehicleDocument $document = null,
    ): array {
        return [
            'document_type' => [
                'required',
                Rule::in(['stnk', 'bpkb', 'invoice', 'receipt', 'form_a', 'kir', 'other']),
                Rule::unique(VehicleDocument::class, 'document_type')
                    ->where(fn (QueryBuilder $query) => $query->where('car_id', $car->id))
                    ->ignore($document),
            ],
            'document_number' => ['nullable', 'string', 'max:100'],
            'owner_name' => ['nullable', 'string', 'max:100'],
            'issued_at' => ['nullable', 'date'],
            'expires_at' => [
                'nullable',
                'date',
                ...($this->filled('issued_at') ? ['after_or_equal:issued_at'] : []),
            ],
            'status' => [
                'required',
                Rule::in(['complete', 'pending', 'processing', 'missing']),
            ],
            'original_received' => ['required', 'boolean'],
            'file' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
            'remove_file' => ['sometimes', 'boolean'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'document_type.unique' => 'Jenis dokumen ini sudah tercatat untuk mobil tersebut.',
            'expires_at.after_or_equal' => 'Tanggal berlaku sampai tidak boleh sebelum tanggal terbit.',
            'file.mimes' => 'Berkas harus berupa PDF, JPG, JPEG, atau PNG.',
            'file.max' => 'Ukuran berkas maksimal 5 MB.',
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'document_type' => 'jenis dokumen',
            'document_number' => 'nomor dokumen',
            'owner_name' => 'nama pemilik',
            'issued_at' => 'tanggal terbit',
            'expires_at' => 'tanggal berlaku sampai',
            'status' => 'status dokumen',
            'original_received' => 'dokumen asli diterima',
            'file' => 'berkas dokumen',
            'notes' => 'catatan',
        ];
    }
}

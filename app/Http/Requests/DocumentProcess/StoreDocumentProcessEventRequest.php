<?php

declare(strict_types=1);

namespace App\Http\Requests\DocumentProcess;

use App\Models\DocumentProcess;
use Carbon\Carbon;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;
use Throwable;

class StoreDocumentProcessEventRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $occurredAt = $this->input('occurred_at');

        if (
            is_string($occurredAt)
            && preg_match(
                '/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/D',
                $occurredAt,
            ) === 1
        ) {
            try {
                $this->merge([
                    'occurred_at' => Carbon::parse(
                        $occurredAt,
                        'Asia/Makassar',
                    )->utc()->format('Y-m-d H:i:s'),
                ]);
            } catch (Throwable) {
                // Let the normal date validator report malformed input.
            }
        }

        $result = (array) $this->input('result', []);
        if (
            isset($result['plate_prefix']) || isset($result['plate_number']) || isset($result['plate_suffix'])
        ) {
            $prefix = strtoupper(trim((string) ($result['plate_prefix'] ?? '')));
            $number = trim((string) ($result['plate_number'] ?? ''));
            $suffix = strtoupper(trim((string) ($result['plate_suffix'] ?? '')));

            $combined = trim("{$prefix} {$number}".($suffix !== '' ? " {$suffix}" : ''));
            $result['license_plate'] = $combined !== '' ? $combined : null;
            $this->merge(['result' => $result]);
        } elseif (isset($result['license_plate']) && is_string($result['license_plate'])) {
            $normalized = preg_replace('/\s+/', ' ', strtoupper(trim($result['license_plate'])));
            $result['license_plate'] = $normalized !== '' ? $normalized : null;
            $this->merge(['result' => $result]);
        }
    }

    /** @return array<string, array<mixed>> */
    public function rules(): array
    {
        return [
            'status' => [
                'required',
                Rule::in(array_keys(DocumentProcess::STATUS_LABELS)),
            ],
            'occurred_at' => ['required', 'date', 'before_or_equal:now'],
            'description' => ['required', 'string', 'max:255'],
            'location' => ['nullable', 'string', 'max:150'],
            'recipient_name' => ['nullable', 'string', 'max:150'],
            'recipient_phone' => ['nullable', 'string', 'max:30'],
            'recipient_relation' => ['nullable', 'string', 'max:50'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'received_items' => ['nullable', 'array'],
            'received_items.*' => ['integer', 'distinct'],
            'result' => ['nullable', 'array'],
            'result.annual_tax_due_at' => ['nullable', 'date'],
            'result.stnk_expires_at' => ['nullable', 'date'],
            'result.owner_name' => ['nullable', 'string', 'max:150'],
            'result.license_plate' => [
                'nullable',
                'string',
                'max:20',
                'regex:/^[A-Z]{1,2}\s\d{1,4}(\s[A-Z]{1,3})?$/',
            ],
            'files' => ['nullable', 'array', 'max:5'],
            'files.*' => [
                'file',
                'mimes:pdf,jpg,jpeg,png,webp',
                'max:5120',
            ],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if ($validator->errors()->any()) {
                return;
            }

            /** @var DocumentProcess|null $process */
            $process = $this->route('documentProcess');

            if ($process === null) {
                return;
            }

            if (in_array($process->status, ['completed', 'cancelled'], true)) {
                $validator->errors()->add(
                    'status',
                    'Proses yang sudah selesai atau dibatalkan tidak dapat diperbarui.',
                );
            }

            if ($this->input('status') === 'cancelled') {
                $validator->errors()->add(
                    'status',
                    'Gunakan aksi Batalkan proses agar alasan pembatalan tercatat.',
                );
            }

            $receivedItemsInput = $this->input('received_items');
            /** @var array<int, int|string> $receivedItems */
            $receivedItems = is_array($receivedItemsInput)
                ? $receivedItemsInput
                : [];
            $receivedItemIds = array_values(array_unique(array_map(
                static fn (int|string $itemId): int => (int) $itemId,
                $receivedItems,
            )));

            if (
                $receivedItemIds !== []
                && $process->items()->whereKey($receivedItemIds)->count()
                    !== count($receivedItemIds)
            ) {
                $validator->errors()->add(
                    'received_items',
                    'Salah satu dokumen yang dipilih tidak termasuk dalam proses ini.',
                );
            }

            if ($this->input('status') !== 'completed') {
                return;
            }

            if (
                $process->process_type === 'annual_tax'
                && ! $this->filled('result.annual_tax_due_at')
            ) {
                $validator->errors()->add(
                    'result.annual_tax_due_at',
                    'Jatuh tempo pajak tahunan yang baru wajib diisi.',
                );
            }

            if (
                $process->process_type === 'five_year_tax'
                && ! $this->filled('result.stnk_expires_at')
            ) {
                $validator->errors()->add(
                    'result.stnk_expires_at',
                    'Masa berlaku STNK lima tahunan yang baru wajib diisi.',
                );
            }
        });
    }

    /** @return array<string, string> */
    public function attributes(): array
    {
        return [
            'status' => 'tahap proses baru',
            'occurred_at' => 'waktu pelaksanaan',
            'description' => 'keterangan aktivitas',
            'location' => 'lokasi pelaksanaan',
            'recipient_name' => 'nama penerima berkas',
            'recipient_phone' => 'no. telepon penerima',
            'recipient_relation' => 'hubungan penerima',
            'notes' => 'catatan aktivitas',
            'received_items' => 'dokumen yang diterima',
            'files' => 'foto / dokumen pendukung',
            'result.license_plate' => 'plat nomor baru',
            'result.owner_name' => 'nama pemilik baru',
            'result.annual_tax_due_at' => 'jatuh tempo pajak tahunan baru',
            'result.stnk_expires_at' => 'masa berlaku STNK baru',
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'occurred_at.before_or_equal' => 'Waktu pelaksanaan tidak boleh melebihi waktu saat ini.',
            'result.license_plate.regex' => 'Format plat nomor tidak valid (contoh: KT 1234 TB atau B 1234 ABC).',
        ];
    }
}

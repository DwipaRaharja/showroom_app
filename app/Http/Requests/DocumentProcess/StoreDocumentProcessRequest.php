<?php

declare(strict_types=1);

namespace App\Http\Requests\DocumentProcess;

use App\Models\DocumentProcess;
use App\Models\Sale;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreDocumentProcessRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        foreach ([
            'sale_id',
            'customer_id',
            'assigned_to',
            'initial_cost',
        ] as $key) {
            if ($this->input($key) === '') {
                $this->merge([$key => null]);
            }
        }
    }

    /** @return array<string, array<mixed>> */
    public function rules(): array
    {
        return [
            'car_id' => [
                'required',
                Rule::exists('cars', 'id')->whereNull('deleted_at'),
            ],
            'sale_id' => ['nullable', Rule::exists('sales', 'id')],
            'customer_id' => ['nullable', Rule::exists('customers', 'id')],
            'assigned_to' => ['nullable', Rule::exists('users', 'id')],
            'process_type' => [
                'required',
                Rule::in(array_keys(DocumentProcess::TYPE_LABELS)),
            ],
            'started_at' => ['required', 'date', 'before_or_equal:today'],
            'estimated_completion_date' => [
                'nullable',
                'date',
                'after_or_equal:started_at',
            ],
            'processor_name' => ['nullable', 'string', 'max:120'],
            'processor_phone' => ['nullable', 'string', 'max:30'],
            'origin_region' => ['nullable', 'string', 'max:120'],
            'destination_region' => ['nullable', 'string', 'max:120'],
            'target_owner_name' => ['nullable', 'string', 'max:150'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'initial_cost' => ['required', 'integer', 'min:1'],
            'initial_cost_paid_by' => [
                'required',
                Rule::in(['showroom', 'customer']),
            ],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if ($validator->errors()->any()) {
                return;
            }

            $carId = $this->integer('car_id');
            $type = (string) $this->input('process_type');
            $activeProcess = DocumentProcess::query()
                ->where('car_id', $carId)
                ->whereNotIn('status', DocumentProcess::CLOSED_STATUSES)
                ->oldest('id')
                ->first(['process_number']);

            if ($activeProcess !== null) {
                $validator->errors()->add(
                    'car_id',
                    "Mobil ini masih memiliki proses berkas aktif ({$activeProcess->process_number}). Selesaikan atau batalkan proses tersebut terlebih dahulu.",
                );
            }

            if ($this->filled('sale_id')) {
                $sale = Sale::query()->find($this->integer('sale_id'));

                if ($sale !== null && $sale->car_id !== $carId) {
                    $validator->errors()->add(
                        'sale_id',
                        'Transaksi penjualan tidak terkait dengan mobil yang dipilih.',
                    );
                }
            }

            if (
                $type === 'name_transfer'
                && ! $this->filled('target_owner_name')
            ) {
                $validator->errors()->add(
                    'target_owner_name',
                    'Nama pemilik baru wajib diisi untuk proses balik nama.',
                );
            }

            if (
                $type === 'mutation'
                && (
                    ! $this->filled('origin_region')
                    || ! $this->filled('destination_region')
                )
            ) {
                $validator->errors()->add(
                    'destination_region',
                    'Daerah asal dan tujuan wajib diisi untuk proses mutasi.',
                );
            }
        });
    }
}

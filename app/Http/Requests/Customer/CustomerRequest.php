<?php

namespace App\Http\Requests\Customer;

use App\Models\Customer;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

abstract class CustomerRequest extends FormRequest
{
    /**
     * Prepare and normalize customer data before validation.
     */
    protected function prepareForValidation(): void
    {
        $phone = trim((string) $this->input('phone'));
        $ktpNumber = trim((string) $this->input('ktp_number'));
        $address = trim((string) $this->input('address'));

        $this->merge([
            'name' => preg_replace('/\s+/', ' ', trim((string) $this->input('name'))),
            'phone' => $phone === '' ? null : $this->normalizePhone($phone),
            'ktp_number' => $ktpNumber === ''
                ? null
                : preg_replace('/[\s-]+/', '', $ktpNumber),
            'address' => $address === '' ? null : $address,
        ]);
    }

    /**
     * Get the shared customer validation rules.
     *
     * @return array<string, array<mixed>>
     */
    protected function customerRules(?Customer $customer = null): array
    {
        return [
            'name' => [
                'required',
                'string',
                'max:100',
            ],
            'phone' => [
                'nullable',
                'string',
                'max:16',
                'regex:/^\+62[0-9]{8,13}$/',
                Rule::unique(Customer::class, 'phone')->ignore($customer),
            ],
            'ktp_number' => [
                'nullable',
                'digits:16',
                Rule::unique(Customer::class, 'ktp_number')->ignore($customer),
            ],
            'address' => [
                'nullable',
                'string',
                'max:500',
            ],
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
            'phone.regex' => 'Nomor telepon harus menggunakan format Indonesia yang valid, contoh 081234567890.',
            'phone.unique' => $this->uniqueCustomerMessage(
                'phone',
                $this->input('phone'),
                'Nomor telepon / WhatsApp',
            ),
            'ktp_number.digits' => 'Nomor KTP / NIK harus terdiri dari tepat 16 digit.',
            'ktp_number.unique' => $this->uniqueCustomerMessage(
                'ktp_number',
                $this->input('ktp_number'),
                'Nomor KTP / NIK',
            ),
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
            'name' => 'nama customer',
            'phone' => 'nomor telepon / WhatsApp',
            'ktp_number' => 'nomor KTP / NIK',
            'address' => 'alamat',
        ];
    }

    /**
     * Normalize common Indonesian phone formats into the +62 format.
     */
    private function normalizePhone(string $phone): string
    {
        $phone = preg_replace('/[\s().-]+/', '', $phone) ?? $phone;

        if (str_starts_with($phone, '0')) {
            return '+62'.substr($phone, 1);
        }

        if (str_starts_with($phone, '62')) {
            return '+'.$phone;
        }

        if (str_starts_with($phone, '8')) {
            return '+62'.$phone;
        }

        return $phone;
    }

    /**
     * Build a contextual unique-value message for active or archived data.
     */
    private function uniqueCustomerMessage(
        string $column,
        mixed $value,
        string $attribute,
    ): string {
        $customer = $value === null
            ? null
            : Customer::query()
                ->withTrashed()
                ->where($column, $value)
                ->first();

        if ($customer?->trashed()) {
            return "{$attribute} sudah digunakan oleh customer yang diarsipkan. Pulihkan data tersebut melalui filter Diarsipkan.";
        }

        return "{$attribute} sudah digunakan oleh customer lain.";
    }
}

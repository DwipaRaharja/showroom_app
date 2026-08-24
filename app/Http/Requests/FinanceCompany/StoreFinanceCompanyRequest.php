<?php

declare(strict_types=1);

namespace App\Http\Requests\FinanceCompany;

use Illuminate\Foundation\Http\FormRequest;

class StoreFinanceCompanyRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:100', 'unique:finance_companies,name'],
            'code' => ['nullable', 'string', 'max:30'],
            'pic_name' => ['nullable', 'string', 'max:100'],
            'pic_phone' => ['nullable', 'string', 'max:30'],
            'is_active' => ['required', 'boolean'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'is_active.required' => 'Pilih status rekanan: aktif atau tidak aktif.',
            'is_active.boolean' => 'Pilih status rekanan: aktif atau tidak aktif.',
        ];
    }

    /**
     * Get custom attributes for validator errors.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'name' => 'nama perusahaan leasing',
            'code' => 'kode singkatan leasing',
            'pic_name' => 'nama PIC / marketing leasing',
            'pic_phone' => 'nomor HP / WhatsApp PIC',
            'is_active' => 'status aktif',
            'notes' => 'catatan / syarat kerjasama',
        ];
    }
}

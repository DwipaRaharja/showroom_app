<?php

namespace App\Http\Requests\Brand;

use App\Models\Brand;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class UpdateBrandRequest extends FormRequest
{
    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'name' => trim((string) $this->input('name')),
            'slug' => Str::slug($this->input('name')),
        ]);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, array<mixed>>
     */
    public function rules(): array
    {
        $brand = $this->route('brand');

        return [
            'name' => [
                'required',
                'string',
                'max:100',
                Rule::unique(Brand::class, 'name')->ignore($brand),
            ],
            'slug' => [
                'required',
                'string',
                'max:120',
                Rule::unique(Brand::class, 'slug')->ignore($brand),
            ],
            'is_active' => ['required', 'boolean'],
        ];
    }

    /**
     * Get custom validation messages.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        $brand = $this->route('brand');
        $existingBrandQuery = Brand::query();

        if ($brand instanceof Brand) {
            $existingBrandQuery->whereKeyNot($brand->getKey());
        }

        $existingBrand = $existingBrandQuery
            ->where(function ($query): void {
                $query
                    ->where('name', $this->input('name'))
                    ->orWhere('slug', $this->input('slug'));
            })
            ->first();

        $duplicateMessage = match ($existingBrand?->is_active) {
            true => 'Merek ini sudah terdaftar dan berstatus aktif.',
            false => 'Merek ini sudah terdaftar tetapi sedang nonaktif. Aktifkan kembali melalui filter Tidak aktif.',
            default => 'Merek ini sudah terdaftar.',
        };

        return [
            'name.unique' => $duplicateMessage,
            'slug.unique' => $duplicateMessage,
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
            'name' => 'nama merek',
            'slug' => 'slug',
            'is_active' => 'status',
        ];
    }
}

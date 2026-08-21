<?php

namespace App\Http\Requests\Customer;

class StoreCustomerRequest extends CustomerRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, array<mixed>>
     */
    public function rules(): array
    {
        return $this->customerRules();
    }
}

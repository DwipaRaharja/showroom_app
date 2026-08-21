<?php

namespace App\Http\Requests\Customer;

use App\Models\Customer;

class UpdateCustomerRequest extends CustomerRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, array<mixed>>
     */
    public function rules(): array
    {
        $customer = $this->route('customer');

        return $this->customerRules(
            $customer instanceof Customer ? $customer : null,
        );
    }
}

<?php

namespace App\Http\Requests\Purchase;

class StorePurchaseRequest extends PurchaseRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, array<mixed>>
     */
    public function rules(): array
    {
        return $this->purchaseRules();
    }
}

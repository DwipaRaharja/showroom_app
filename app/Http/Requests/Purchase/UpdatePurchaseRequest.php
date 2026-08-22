<?php

namespace App\Http\Requests\Purchase;

use App\Models\Purchase;

class UpdatePurchaseRequest extends PurchaseRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, array<mixed>>
     */
    public function rules(): array
    {
        $purchase = $this->route('purchase');

        return $this->purchaseRules(
            $purchase instanceof Purchase ? $purchase : null,
        );
    }
}

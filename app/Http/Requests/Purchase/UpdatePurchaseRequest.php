<?php

namespace App\Http\Requests\Purchase;

use App\Models\Purchase;
use Illuminate\Validation\Rule;

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

        $rules = $this->purchaseRules(
            $purchase instanceof Purchase ? $purchase : null,
        );

        if ($purchase instanceof Purchase) {
            $rules['car_id'][] = Rule::in([$purchase->car_id]);
        }

        return $rules;
    }
}

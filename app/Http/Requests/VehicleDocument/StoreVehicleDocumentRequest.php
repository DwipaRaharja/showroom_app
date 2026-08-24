<?php

namespace App\Http\Requests\VehicleDocument;

class StoreVehicleDocumentRequest extends VehicleDocumentRequest
{
    /**
     * @return array<string, array<mixed>>
     */
    public function rules(): array
    {
        return $this->documentRules();
    }
}

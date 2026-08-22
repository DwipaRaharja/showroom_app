<?php

namespace App\Http\Requests\VehicleDocument;

use App\Models\Car;

class StoreVehicleDocumentRequest extends VehicleDocumentRequest
{
    /**
     * @return array<string, array<mixed>>
     */
    public function rules(): array
    {
        $car = $this->route('car');

        abort_unless($car instanceof Car, 404);

        return $this->documentRules($car);
    }
}

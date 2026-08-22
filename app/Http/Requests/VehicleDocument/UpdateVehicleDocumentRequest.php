<?php

namespace App\Http\Requests\VehicleDocument;

use App\Models\Car;
use App\Models\VehicleDocument;

class UpdateVehicleDocumentRequest extends VehicleDocumentRequest
{
    /**
     * @return array<string, array<mixed>>
     */
    public function rules(): array
    {
        $document = $this->route('vehicleDocument');

        abort_unless($document instanceof VehicleDocument, 404);

        $car = $document->car;

        abort_unless($car instanceof Car, 404);

        return $this->documentRules($car, $document);
    }
}

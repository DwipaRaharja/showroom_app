<?php

namespace Database\Factories;

use App\Models\Car;
use App\Models\VehicleDocument;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<VehicleDocument>
 */
class VehicleDocumentFactory extends Factory
{
    public function definition(): array
    {
        return [
            'car_id' => Car::factory(),
            'document_type' => 'stnk',
            'document_number' => strtoupper($this->faker->bothify('DOC-####-????')),
            'owner_name' => $this->faker->name(),
            'issued_at' => $this->faker->dateTimeBetween('-3 years', '-1 month'),
            'expires_at' => $this->faker->dateTimeBetween('+1 month', '+2 years'),
            'status' => 'complete',
            'original_received' => true,
            'notes' => null,
        ];
    }
}

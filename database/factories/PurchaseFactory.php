<?php

namespace Database\Factories;

use App\Models\Car;
use App\Models\Purchase;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Carbon;

/**
 * @extends Factory<Purchase>
 */
class PurchaseFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $purchaseDate = fake()->dateTimeBetween('-1 year', 'now')->format('Y-m-d');

        return [
            'purchase_number' => fn (array $attributes) => Purchase::generatePurchaseNumber(
                isset($attributes['purchase_date']) ? Carbon::parse($attributes['purchase_date']) : Carbon::parse($purchaseDate)
            ),
            'car_id' => Car::factory(),
            'purchase_date' => $purchaseDate,
            'price' => fake()->numberBetween(100, 700) * 1_000_000,
            'repair_cost' => fake()->numberBetween(0, 20) * 1_000_000,
            'transport_cost' => fake()->numberBetween(0, 5) * 500_000,
            'other_cost' => fake()->numberBetween(0, 5) * 250_000,
            'status' => fake()->randomElement(['draft', 'completed', 'completed', 'cancelled']),
            'notes' => fake()->optional()->sentence(),
        ];
    }
}

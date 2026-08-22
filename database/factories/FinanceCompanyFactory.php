<?php

namespace Database\Factories;

use App\Models\FinanceCompany;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<FinanceCompany>
 */
class FinanceCompanyFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->company().' Finance',
            'code' => strtoupper(fake()->lexify('???')),
            'pic_name' => fake()->name(),
            'pic_phone' => fake()->phoneNumber(),
            'is_active' => true,
            'notes' => fake()->optional()->sentence(),
        ];
    }
}

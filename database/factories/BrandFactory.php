<?php

namespace Database\Factories;

use App\Models\Brand;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Brand>
 */
class BrandFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $vehicleBrands = [
            'Toyota', 'Honda', 'Daihatsu', 'Suzuki', 'Mitsubishi',
            'Nissan', 'Isuzu', 'Mazda', 'Wuling', 'Hyundai',
            'Kia', 'BMW', 'Mercedes-Benz', 'Lexus', 'Volkswagen',
            'Audi', 'Chery', 'MG', 'DFSK', 'Hino', 'Volvo', 'Peugeot',
            'Renault', 'Subaru', 'Ford', 'Chevrolet', 'Jeep', 'Porsche',
        ];

        $name = $this->faker->unique()->randomElement($vehicleBrands);

        return [
            'name' => $name,
            'slug' => Str::slug($name),
            'logo' => null,
            'is_active' => $this->faker->boolean(90), // 90% chance to be active
        ];
    }
}

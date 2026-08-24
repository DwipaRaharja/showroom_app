<?php

namespace Database\Factories;

use App\Models\Brand;
use App\Models\Car;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Car>
 */
class CarFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $carModels = [
            'Avanza 1.3 G',
            'Innova Zenix 2.0 V',
            'Fortuner 2.8 VRZ',
            'Brio RS 1.2',
            'HR-V 1.5 SE',
            'CR-V 1.5 Turbo',
            'Xpander Ultimate 1.5',
            'Pajero Sport Dakar 4x2',
            'Terios 1.5 R Custom',
            'Rocky 1.0 R TC',
            'Ertiga GX Hybrid',
            'XL7 Alpha',
            'Almaz RS Pro',
            'Air EV Long Range',
            'Creta Prime 1.5',
            'Ioniq 5 Signature Long Range',
            'Palisade 2.2 Signature',
            'CX-5 Elite 2.5',
            'CX-3 1.5 Sport',
            'C-Class C200 Avantgarde',
            '3 Series 330i M Sport',
        ];

        $colors = [
            'Hitam Metalik',
            'Putih Mutiara',
            'Abu-Abu Metalik',
            'Silver Metalik',
            'Merah Marun',
            'Biru Tua',
            'Coklat Metalik',
        ];

        $platePrefixes = ['B', 'D', 'F', 'L', 'N', 'AB', 'AD', 'H'];
        $platePrefix = $this->faker->randomElement($platePrefixes);
        $plateNumber = $this->faker->unique()->numberBetween(1000, 9999);
        $plateSuffix = strtoupper($this->faker->lexify('???'));
        $licensePlate = "{$platePrefix} {$plateNumber} {$plateSuffix}";

        $capitalEstimate = $this->faker->numberBetween(100, 700) * 1_000_000;
        $sellingPrice = $capitalEstimate + ($this->faker->numberBetween(15, 45) * 1_000_000);

        return [
            'brand_id' => Brand::query()->inRandomOrder()->value('id') ?? Brand::factory(),
            'name' => $this->faker->randomElement($carModels),
            'license_plate' => $licensePlate,
            'chassis_number' => 'MHF'.strtoupper($this->faker->unique()->bothify('??##?#?######')),
            'engine_number' => strtoupper($this->faker->unique()->bothify('2NR-#######')),
            'year' => $this->faker->numberBetween(2018, 2024),
            'color' => $this->faker->randomElement($colors),
            'transmission' => $this->faker->randomElement(['manual', 'automatic', 'cvt']),
            'fuel_type' => $this->faker->randomElement(['bensin', 'diesel', 'hybrid', 'electric']),
            'mileage' => $this->faker->numberBetween(5_000, 95_000),
            'selling_price' => $sellingPrice,
            'status' => $this->faker->randomElement(['available', 'available', 'available', 'booked', 'sold']),
            'description' => 'Kondisi istimewa, servis rutin bengkel resmi, surat-surat lengkap (STNK, BPKB, Faktur). Siap pakai.',
            'image' => null,
        ];
    }
}

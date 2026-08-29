<?php

namespace Database\Seeders;

use App\Models\Car;
use App\Models\Purchase;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class PurchaseSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Pastikan ada data mobil terlebih dahulu
        if (Car::count() === 0) {
            $this->call(CarSeeder::class);
        }

        // Ambil mobil yang belum memiliki data modal
        $cars = Car::query()
            ->whereDoesntHave('capital')
            ->get();

        $realisticNotes = [
            'Modal mencakup servis awal dan inspeksi kendaraan.',
            'Unit membutuhkan rekondisi ringan pada interior sebelum dipasarkan.',
            'Biaya tambahan mencakup penggantian ban dan servis berkala.',
            'Unit sudah diperiksa dan siap masuk tahap persiapan penjualan.',
            'Unit lulus inspeksi dan tidak memerlukan perbaikan besar.',
        ];

        $statuses = ['completed', 'completed', 'completed', 'draft'];

        foreach ($cars as $index => $car) {
            $purchaseDate = Carbon::now()->subDays(fake()->numberBetween(5, 180));
            $estimatedMargin = fake()->numberBetween(15, 45) * 1_000_000;
            $price = max(0, (int) $car->selling_price - $estimatedMargin);

            Purchase::query()->create([
                'purchase_number' => Purchase::generatePurchaseNumber($purchaseDate),
                'car_id' => $car->id,
                'purchase_date' => $purchaseDate->format('Y-m-d'),
                'price' => $price,
                'repair_cost' => fake()->numberBetween(0, 15) * 1_000_000,
                'transport_cost' => fake()->numberBetween(0, 4) * 500_000,
                'other_cost' => fake()->numberBetween(0, 4) * 250_000,
                'status' => fake()->randomElement($statuses),
                'notes' => $realisticNotes[$index % count($realisticNotes)],
                'created_at' => $purchaseDate,
                'updated_at' => $purchaseDate,
            ]);
        }
    }
}

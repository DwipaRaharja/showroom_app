<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            UserSeeder::class,
            BrandSeeder::class,
            CustomerSeeder::class,
            CarSeeder::class,
            PurchaseSeeder::class,
            FinanceCompanySeeder::class,
            SaleSeeder::class,
        ]);
    }
}

<?php

namespace Database\Seeders;

use App\Models\User;
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
        // User::factory(10)->create();

        if (User::count() === 0) {
            User::factory()->create([
                'name' => 'Admin Showroom',
                'email' => 'admin@example.com',
                'password' => bcrypt('password'),
            ]);
        }

        $this->call([
            BrandSeeder::class,
            CustomerSeeder::class,
            CarSeeder::class,
        ]);
    }
}

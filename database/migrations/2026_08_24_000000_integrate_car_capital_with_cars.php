<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Move every legacy car purchase price into the capital ledger and remove
     * the duplicated value from the cars table.
     */
    public function up(): void
    {
        if (! Schema::hasColumn('cars', 'purchase_price')) {
            return;
        }

        DB::table('cars')
            ->whereNotNull('purchase_price')
            ->orderBy('id')
            ->get(['id', 'purchase_price', 'created_at'])
            ->each(function (object $car): void {
                $hasCapital = DB::table('purchases')
                    ->where('car_id', $car->id)
                    ->exists();

                if ($hasCapital) {
                    return;
                }

                DB::table('purchases')->insert([
                    'purchase_number' => sprintf('MDL-MIG-%010d', $car->id),
                    'car_id' => $car->id,
                    'seller_id' => null,
                    'purchase_date' => substr((string) ($car->created_at ?? now()), 0, 10),
                    'price' => $car->purchase_price,
                    'repair_cost' => 0,
                    'transport_cost' => 0,
                    'other_cost' => 0,
                    'payment_method' => 'transfer',
                    'status' => 'completed',
                    'notes' => 'Migrasi otomatis dari harga modal pada data mobil.',
                    'created_at' => $car->created_at ?? now(),
                    'updated_at' => now(),
                ]);
            });

        Schema::table('cars', function (Blueprint $table): void {
            $table->dropColumn('purchase_price');
        });
    }

    /**
     * Restore the legacy cache when rolling the migration back.
     */
    public function down(): void
    {
        if (Schema::hasColumn('cars', 'purchase_price')) {
            return;
        }

        Schema::table('cars', function (Blueprint $table): void {
            $table->unsignedBigInteger('purchase_price')
                ->nullable()
                ->after('mileage')
                ->comment('Harga Beli');
        });

        DB::table('purchases')
            ->where('status', 'completed')
            ->orderBy('id')
            ->get([
                'car_id',
                'price',
                'repair_cost',
                'transport_cost',
                'other_cost',
            ])
            ->each(function (object $capital): void {
                if ($capital->car_id === null) {
                    return;
                }

                DB::table('cars')
                    ->where('id', $capital->car_id)
                    ->update([
                        'purchase_price' => (int) $capital->price
                            + (int) $capital->repair_cost
                            + (int) $capital->transport_cost
                            + (int) $capital->other_cost,
                    ]);
            });
    }
};

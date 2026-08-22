<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::table('purchases')
            ->where('status', 'partial')
            ->update(['status' => 'draft']);

        if (DB::getDriverName() === 'mysql') {
            DB::statement(
                "ALTER TABLE purchases MODIFY status ENUM('draft', 'completed', 'cancelled') NOT NULL DEFAULT 'completed'",
            );
        }

        $legacyNumbers = DB::table('purchases')
            ->where('purchase_number', 'like', 'PB-%')
            ->orderBy('id')
            ->pluck('purchase_number', 'id');

        foreach ($legacyNumbers as $id => $legacyNumber) {
            if (! is_string($legacyNumber)) {
                continue;
            }

            $capitalNumber = 'MDL-'.substr($legacyNumber, 3);

            $numberIsAvailable = ! DB::table('purchases')
                ->where('purchase_number', $capitalNumber)
                ->exists();

            if ($numberIsAvailable) {
                DB::table('purchases')
                    ->where('id', $id)
                    ->update(['purchase_number' => $capitalNumber]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement(
                "ALTER TABLE purchases MODIFY status ENUM('draft', 'partial', 'completed', 'cancelled') NOT NULL DEFAULT 'completed'",
            );
        }
    }
};

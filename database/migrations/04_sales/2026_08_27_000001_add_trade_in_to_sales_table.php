<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->string('payment_type', 32)->default('cash_full')->change();
            $table->string('trade_in_license_plate', 20)->nullable()->after('notes');
            $table->string('trade_in_brand', 100)->nullable()->after('trade_in_license_plate');
            $table->string('trade_in_car_name', 150)->nullable()->after('trade_in_brand');
            $table->smallInteger('trade_in_year')->nullable()->after('trade_in_car_name');
            $table->string('trade_in_color', 50)->nullable()->after('trade_in_year');
            $table->unsignedInteger('trade_in_mileage')->nullable()->after('trade_in_color');
            $table->text('trade_in_notes')->nullable()->after('trade_in_mileage');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropColumn([
                'trade_in_license_plate',
                'trade_in_brand',
                'trade_in_car_name',
                'trade_in_year',
                'trade_in_color',
                'trade_in_mileage',
                'trade_in_notes',
            ]);
        });
    }
};

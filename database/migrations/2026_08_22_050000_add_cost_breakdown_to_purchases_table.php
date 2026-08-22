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
        Schema::table('purchases', function (Blueprint $table) {
            $table->unsignedBigInteger('repair_cost')->default(0)->after('price');
            $table->unsignedBigInteger('document_cost')->default(0)->after('repair_cost');
            $table->unsignedBigInteger('transport_cost')->default(0)->after('document_cost');
            $table->unsignedBigInteger('other_cost')->default(0)->after('transport_cost');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('purchases', function (Blueprint $table) {
            $table->dropColumn([
                'repair_cost',
                'document_cost',
                'transport_cost',
                'other_cost',
            ]);
        });
    }
};

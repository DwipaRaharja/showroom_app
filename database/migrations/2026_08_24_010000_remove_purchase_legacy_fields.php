<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Remove fields left behind by the former customer-purchase workflow.
     */
    public function up(): void
    {
        Schema::table('purchases', function (Blueprint $table): void {
            if (Schema::hasColumn('purchases', 'seller_id')) {
                $table->dropConstrainedForeignId('seller_id');
            }

            if (Schema::hasColumn('purchases', 'payment_method')) {
                $table->dropColumn('payment_method');
            }
        });
    }

    /**
     * Restore the legacy fields when rolling back.
     */
    public function down(): void
    {
        Schema::table('purchases', function (Blueprint $table): void {
            if (! Schema::hasColumn('purchases', 'seller_id')) {
                $table->foreignId('seller_id')
                    ->nullable()
                    ->after('car_id')
                    ->constrained('customers')
                    ->nullOnDelete();
            }

            if (! Schema::hasColumn('purchases', 'payment_method')) {
                $table->enum('payment_method', ['cash', 'transfer', 'financing'])
                    ->default('transfer')
                    ->after('other_cost');
            }
        });
    }
};

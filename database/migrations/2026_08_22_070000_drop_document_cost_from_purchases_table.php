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
        if (! Schema::hasColumn('purchases', 'document_cost')) {
            return;
        }

        Schema::table('purchases', function (Blueprint $table) {
            $table->dropColumn('document_cost');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('purchases', 'document_cost')) {
            return;
        }

        Schema::table('purchases', function (Blueprint $table) {
            $table->unsignedBigInteger('document_cost')->default(0)->after('repair_cost');
        });
    }
};

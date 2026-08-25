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
        Schema::create('purchases', function (Blueprint $table) {
            $table->id();
            $table->foreignId('car_id')->unique()->constrained('cars')->cascadeOnDelete();
            $table->string('purchase_number', 50)->unique();
            $table->date('purchase_date');
            $table->unsignedBigInteger('price')->default(0)->comment('Harga Beli');
            $table->unsignedBigInteger('repair_cost')->default(0)->comment('Biaya Perbaikan / Salon');
            $table->unsignedBigInteger('transport_cost')->default(0)->comment('Biaya Towing / Angkut');
            $table->unsignedBigInteger('other_cost')->default(0)->comment('Biaya Lain-lain');
            $table->unsignedBigInteger('document_process_cost')->default(0)->comment('Biaya Pengurusan Berkas');
            $table->string('status', 30)->default('completed');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('purchases');
    }
};

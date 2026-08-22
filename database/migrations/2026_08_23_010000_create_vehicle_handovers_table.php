<?php

declare(strict_types=1);

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
        Schema::create('vehicle_handovers', function (Blueprint $table) {
            $table->id();
            $table->string('handover_number', 50)->unique();
            $table->foreignId('sale_id')->constrained('sales')->cascadeOnDelete();
            $table->foreignId('car_id')->constrained('cars')->cascadeOnDelete();

            // Pihak Penerima
            $table->string('recipient_name', 100);
            $table->string('recipient_phone', 30)->nullable();
            $table->string('recipient_id_card', 50)->nullable();
            $table->string('recipient_relation', 50)->default('buyer_self');

            // Staf Showroom
            $table->string('officer_name', 100);

            // Lokasi
            $table->string('handover_location', 100)->default('Showroom Telaga Berlian');
            $table->text('handover_address')->nullable();

            // Tracking Waktu & Status
            $table->dateTime('vehicle_delivered_at')->nullable();
            $table->dateTime('bpkb_delivered_at')->nullable();
            $table->string('bpkb_recipient_type', 50)->nullable();
            $table->string('status', 30)->default('pending'); // pending, vehicle_delivered, completed

            // Checklist & Fisik
            $table->json('checklist')->nullable();
            $table->text('notes')->nullable();
            $table->string('proof_file')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vehicle_handovers');
    }
};

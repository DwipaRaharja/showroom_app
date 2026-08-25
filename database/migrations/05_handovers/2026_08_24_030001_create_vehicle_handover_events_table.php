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
        Schema::create('vehicle_handover_events', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('vehicle_handover_id')->constrained('vehicle_handovers')->cascadeOnDelete();
            $table->string('event_type', 40)->default('item_delivery');
            $table->dateTime('occurred_at');
            $table->string('recipient_name', 100);
            $table->string('recipient_phone', 30)->nullable();
            $table->string('recipient_id_card', 50)->nullable();
            $table->string('recipient_relation', 50)->default('buyer_self');
            $table->string('officer_name', 100);
            $table->string('handover_location', 100)->default('Showroom Telaga Berlian');
            $table->text('handover_address')->nullable();
            $table->json('vehicle_condition')->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['vehicle_handover_id', 'occurred_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vehicle_handover_events');
    }
};

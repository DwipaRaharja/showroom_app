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
        Schema::create('vehicle_handover_items', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('vehicle_handover_event_id')->constrained('vehicle_handover_events')->cascadeOnDelete();
            $table->string('item_code', 50);
            $table->string('item_name', 100);
            $table->unsignedSmallInteger('quantity')->default(1);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(
                ['vehicle_handover_event_id', 'item_code'],
                'handover_event_item_unique',
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vehicle_handover_items');
    }
};

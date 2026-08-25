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
        Schema::create('vehicle_handover_photos', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('vehicle_handover_event_id')->constrained('vehicle_handover_events')->cascadeOnDelete();
            $table->string('file_path');
            $table->string('file_name');
            $table->string('file_mime', 100)->nullable();
            $table->unsignedBigInteger('file_size')->nullable();
            $table->string('caption', 150)->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vehicle_handover_photos');
    }
};

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
        Schema::create('document_process_events', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('document_process_id')->constrained('document_processes')->cascadeOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status', 40);
            $table->timestamp('occurred_at');
            $table->string('description', 255);
            $table->string('location', 150)->nullable();
            $table->string('recipient_name', 150)->nullable();
            $table->string('recipient_phone', 30)->nullable();
            $table->string('recipient_relation', 50)->nullable();
            $table->text('notes')->nullable();
            $table->json('result_data')->nullable();
            $table->timestamps();

            $table->index(['document_process_id', 'occurred_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('document_process_events');
    }
};

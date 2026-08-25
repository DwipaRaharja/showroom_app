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
        Schema::create('document_processes', function (Blueprint $table): void {
            $table->id();
            $table->string('process_number', 32)->unique();
            $table->foreignId('car_id')->constrained('cars')->restrictOnDelete();
            $table->foreignId('sale_id')->nullable()->constrained('sales')->nullOnDelete();
            $table->foreignId('customer_id')->nullable()->constrained('customers')->nullOnDelete();
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('process_type', 40);
            $table->string('status', 40)->default('waiting_documents');
            $table->date('started_at');
            $table->date('estimated_completion_date')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('returned_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->string('processor_name', 120)->nullable();
            $table->string('processor_phone', 30)->nullable();
            $table->string('origin_region', 120)->nullable();
            $table->string('destination_region', 120)->nullable();
            $table->string('target_owner_name', 150)->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['status', 'estimated_completion_date']);
            $table->index(['car_id', 'process_type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('document_processes');
    }
};

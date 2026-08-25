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
        Schema::create('document_process_items', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('document_process_id')->constrained('document_processes')->cascadeOnDelete();
            $table->foreignId('vehicle_document_id')->nullable()->constrained('vehicle_documents')->nullOnDelete();
            $table->string('item_key', 50);
            $table->string('item_name', 120);
            $table->boolean('required')->default(true);
            $table->string('custody_status', 30)->default('waiting');
            $table->timestamp('received_at')->nullable();
            $table->timestamp('returned_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['document_process_id', 'item_key']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('document_process_items');
    }
};

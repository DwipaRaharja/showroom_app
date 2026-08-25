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
        Schema::create('document_process_files', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('document_process_id')->constrained('document_processes')->cascadeOnDelete();
            $table->foreignId('document_process_event_id')->nullable()->constrained('document_process_events')->cascadeOnDelete();
            $table->foreignId('document_process_cost_id')->nullable()->constrained('document_process_costs')->cascadeOnDelete();
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('file_category', 40);
            $table->string('file_path');
            $table->string('file_name');
            $table->string('file_mime', 100)->nullable();
            $table->unsignedBigInteger('file_size')->nullable();
            $table->string('caption', 180)->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('document_process_files');
    }
};

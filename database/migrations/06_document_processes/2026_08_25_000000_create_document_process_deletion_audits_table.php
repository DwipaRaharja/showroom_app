<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('document_process_deletion_audits', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('car_id')->nullable()->constrained('cars')->nullOnDelete();
            $table->foreignId('deleted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('process_number', 32)->index();
            $table->string('process_type', 40);
            $table->string('status', 40);
            $table->text('reason');
            $table->json('snapshot');
            $table->timestamp('deleted_at');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('document_process_deletion_audits');
    }
};

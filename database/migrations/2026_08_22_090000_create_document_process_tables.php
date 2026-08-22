<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('document_processes', function (Blueprint $table) {
            $table->id();
            $table->string('process_number', 32)->unique();
            $table->foreignId('sale_id')->unique()->constrained()->cascadeOnDelete();
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('process_type', [
                'handover',
                'name_transfer',
                'mutation',
                'renewal',
                'other',
            ])->default('handover');
            $table->enum('status', [
                'waiting_documents',
                'ready',
                'processing',
                'completed',
                'handed_over',
                'issue',
                'cancelled',
            ])->default('waiting_documents');
            $table->date('started_at');
            $table->date('estimated_completion_date')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('handed_over_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['status', 'estimated_completion_date']);
        });

        Schema::create('document_process_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('document_process_id')->constrained()->cascadeOnDelete();
            $table->foreignId('vehicle_document_id')->nullable()->constrained()->nullOnDelete();
            $table->enum('document_type', [
                'stnk',
                'bpkb',
                'invoice',
                'receipt',
                'form_a',
                'kir',
                'other',
            ]);
            $table->string('document_number_snapshot', 100)->nullable();
            $table->boolean('required')->default(false);
            $table->enum('status', [
                'waiting',
                'ready',
                'processing',
                'completed',
                'handed_over',
                'issue',
            ])->default('waiting');
            $table->enum('recipient_type', ['customer', 'finance_company', 'other'])->nullable();
            $table->string('recipient_name', 150)->nullable();
            $table->timestamp('handed_over_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['document_process_id', 'document_type']);
        });

        Schema::create('document_process_activities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('document_process_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('type', 50);
            $table->text('description');
            $table->json('metadata')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('document_process_activities');
        Schema::dropIfExists('document_process_items');
        Schema::dropIfExists('document_processes');
    }
};

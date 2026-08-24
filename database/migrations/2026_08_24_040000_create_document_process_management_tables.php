<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('purchases', function (Blueprint $table): void {
            $table->unsignedBigInteger('document_process_cost')
                ->default(0)
                ->after('other_cost');
        });

        Schema::table('vehicle_documents', function (Blueprint $table): void {
            $table->date('annual_tax_due_at')
                ->nullable()
                ->after('expires_at');
        });

        Schema::create('document_processes', function (Blueprint $table): void {
            $table->id();
            $table->string('process_number', 32)->unique();
            $table->foreignId('car_id')->constrained()->restrictOnDelete();
            $table->foreignId('sale_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('customer_id')->nullable()->constrained()->nullOnDelete();
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

        Schema::create('document_process_items', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('document_process_id')->constrained()->cascadeOnDelete();
            $table->foreignId('vehicle_document_id')->nullable()->constrained()->nullOnDelete();
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

        Schema::create('document_process_events', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('document_process_id')->constrained()->cascadeOnDelete();
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

        Schema::create('document_process_costs', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('document_process_id')->constrained()->cascadeOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('cost_type', 40);
            $table->string('description', 180);
            $table->unsignedBigInteger('amount');
            $table->string('paid_by', 30)->default('showroom');
            $table->date('paid_at')->nullable();
            $table->timestamps();

            $table->index(['document_process_id', 'paid_by']);
        });

        Schema::create('document_process_files', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('document_process_id')->constrained()->cascadeOnDelete();
            $table->foreignId('document_process_event_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('document_process_cost_id')->nullable()->constrained()->cascadeOnDelete();
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

    public function down(): void
    {
        Schema::dropIfExists('document_process_files');
        Schema::dropIfExists('document_process_costs');
        Schema::dropIfExists('document_process_events');
        Schema::dropIfExists('document_process_items');
        Schema::dropIfExists('document_processes');

        Schema::table('vehicle_documents', function (Blueprint $table): void {
            $table->dropColumn('annual_tax_due_at');
        });

        Schema::table('purchases', function (Blueprint $table): void {
            $table->dropColumn('document_process_cost');
        });
    }
};

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
        Schema::create('document_process_costs', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('document_process_id')->constrained('document_processes')->cascadeOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('cost_type', 40);
            $table->string('description', 180);
            $table->unsignedBigInteger('amount');
            $table->string('paid_by', 30)->default('showroom');
            $table->date('paid_at')->nullable();
            $table->timestamps();

            $table->index(['document_process_id', 'paid_by']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('document_process_costs');
    }
};

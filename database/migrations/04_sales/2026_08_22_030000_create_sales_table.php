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
        Schema::create('sales', function (Blueprint $table) {
            $table->id();
            $table->string('invoice_number', 32)->unique();
            $table->foreignId('car_id')->unique()->constrained()->cascadeOnDelete();
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
            $table->foreignId('finance_company_id')->nullable()->constrained('finance_companies')->nullOnDelete();
            $table->enum('payment_type', ['cash_full', 'cash_tempo', 'credit'])->default('cash_full');
            $table->unsignedBigInteger('deal_price');
            $table->unsignedBigInteger('down_payment')->default(0);
            $table->unsignedBigInteger('finance_amount')->default(0);
            $table->date('disbursement_estimated_date')->nullable();
            $table->date('disbursement_actual_date')->nullable();
            $table->unsignedBigInteger('leasing_bonus')->default(0);
            $table->date('due_date')->nullable();
            $table->enum('status', ['pending', 'partial', 'completed', 'cancelled'])->default('pending');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sales');
    }
};

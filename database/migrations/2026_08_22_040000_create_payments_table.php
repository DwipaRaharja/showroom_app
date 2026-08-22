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
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->string('payment_number', 32)->unique();
            $table->foreignId('sale_id')->constrained()->cascadeOnDelete();
            $table->date('payment_date');
            $table->enum('payer_type', ['customer', 'finance'])->default('customer');
            $table->enum('payment_category', [
                'down_payment',
                'settlement',
                'installment',
                'finance_disbursement',
                'leasing_bonus',
                'other',
            ])->default('settlement');
            $table->unsignedBigInteger('amount');
            $table->enum('payment_method', ['transfer', 'cash', 'qris', 'giro'])->default('transfer');
            $table->string('destination_account', 100)->default('BCA Showroom');
            $table->string('reference_number', 100)->nullable();
            $table->string('proof_file')->nullable();
            $table->enum('status', ['confirmed', 'pending', 'rejected'])->default('confirmed');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};

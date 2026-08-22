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
        Schema::create('purchases', function (Blueprint $table) {
            $table->id();
            $table->string('purchase_number', 32)->unique();
            $table->foreignId('car_id')->nullable()->unique()->constrained()->nullOnDelete();
            $table->foreignId('seller_id')->nullable()->constrained('customers')->nullOnDelete();
            $table->date('purchase_date');
            $table->unsignedBigInteger('price');
            $table->enum('payment_method', ['cash', 'transfer', 'financing'])->default('transfer');
            $table->enum('status', ['draft', 'completed', 'cancelled'])->default('completed');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('purchases');
    }
};

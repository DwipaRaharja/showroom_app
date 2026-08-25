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
        Schema::create('cars', function (Blueprint $table) {
            $table->id();
            $table->foreignId('brand_id')->constrained('brands')->cascadeOnDelete();
            $table->string('name')->comment('Nama / Varian model mobil');
            $table->string('license_plate', 20)->nullable()->unique()->comment('Nomor Polisi / Plat');
            $table->string('chassis_number', 50)->nullable()->unique()->comment('Nomor Rangka / VIN');
            $table->string('engine_number', 50)->nullable()->unique()->comment('Nomor Mesin');
            $table->year('year')->comment('Tahun pembuatan / perakitan');
            $table->string('color', 50)->nullable()->comment('Warna kendaraan');
            $table->enum('transmission', ['manual', 'automatic', 'cvt'])->default('automatic');
            $table->enum('fuel_type', ['bensin', 'diesel', 'hybrid', 'electric'])->default('bensin');
            $table->unsignedInteger('mileage')->default(0)->comment('Kilometer / Odometer');
            $table->unsignedBigInteger('selling_price')->comment('Harga Jual');
            $table->enum('status', ['available', 'booked', 'sold', 'maintenance'])->default('available');
            $table->text('description')->nullable()->comment('Deskripsi atau catatan kondisi');
            $table->string('image')->nullable()->comment('Foto utama kendaraan');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cars');
    }
};

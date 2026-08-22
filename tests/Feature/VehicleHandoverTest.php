<?php

declare(strict_types=1);

use App\Models\Brand;
use App\Models\Car;
use App\Models\Customer;
use App\Models\Sale;
use App\Models\User;
use App\Models\VehicleHandover;

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->actingAs($this->user);
});

test('it validates that vehicle cannot be delivered if remaining bill is greater than 10 million', function () {
    $brand = Brand::create(['name' => 'Toyota', 'is_active' => true]);
    $car = Car::create([
        'brand_id' => $brand->id,
        'name' => 'Innova Zenix',
        'year' => 2023,
        'transmission' => 'automatic',
        'fuel_type' => 'gasoline',
        'color' => 'Hitam',
        'mileage' => 15000,
        'license_plate' => 'B 1234 TB',
        'status' => 'available',
        'purchase_price' => 350_000_000,
        'selling_price' => 420_000_000,
    ]);

    $customer = Customer::create([
        'name' => 'Budi Santoso',
        'phone' => '081234567890',
        'ktp_number' => '3201234567890001',
    ]);

    $sale = Sale::create([
        'car_id' => $car->id,
        'customer_id' => $customer->id,
        'payment_type' => 'cash_tempo',
        'deal_price' => 400_000_000,
        'down_payment' => 50_000_000,
        'finance_amount' => 0,
        'leasing_bonus' => 0,
        'due_date' => now()->addDays(30),
        'status' => 'partial',
    ]);

    // Sale has 400jt deal price and 0 payments recorded yet, remaining is 400jt (> 10jt)
    expect($sale->can_deliver_vehicle)->toBeFalse()
        ->and($sale->can_deliver_bpkb)->toBeFalse();

    $response = $this->post(route('handovers.store'), [
        'sale_id' => $sale->id,
        'recipient_name' => 'Budi Santoso',
        'recipient_relation' => 'buyer_self',
        'officer_name' => 'Admin Showroom',
        'handover_location' => 'Showroom Telaga Berlian',
        'vehicle_delivered_at' => now()->format('Y-m-d H:i:s'),
    ]);

    $response->assertSessionHasErrors('vehicle_delivered_at');
});

test('it allows vehicle delivery when remaining bill is 10 million or less but blocks BPKB until settled', function () {
    $brand = Brand::create(['name' => 'Honda', 'is_active' => true]);
    $car = Car::create([
        'brand_id' => $brand->id,
        'name' => 'HR-V SE',
        'year' => 2022,
        'transmission' => 'automatic',
        'fuel_type' => 'gasoline',
        'color' => 'Putih',
        'mileage' => 25000,
        'license_plate' => 'B 5678 TB',
        'status' => 'available',
        'purchase_price' => 300_000_000,
        'selling_price' => 350_000_000,
    ]);

    $customer = Customer::create([
        'name' => 'Ahmad Dani',
        'phone' => '081298765432',
    ]);

    $sale = Sale::create([
        'car_id' => $car->id,
        'customer_id' => $customer->id,
        'payment_type' => 'cash_tempo',
        'deal_price' => 350_000_000,
        'down_payment' => 342_000_000,
        'finance_amount' => 0,
        'leasing_bonus' => 0,
        'status' => 'partial',
    ]);

    // Record payment of 342jt so remaining is 8jt (<= 10jt)
    $sale->payments()->create([
        'payment_number' => 'KW-TEST-001',
        'payment_date' => now()->format('Y-m-d'),
        'payer_type' => 'customer',
        'payment_category' => 'down_payment',
        'amount' => 342_000_000,
        'payment_method' => 'transfer',
        'destination_account' => 'BCA 123456789',
        'status' => 'confirmed',
    ]);

    $sale->refresh();

    expect($sale->remaining_bill)->toBe(8_000_000)
        ->and($sale->can_deliver_vehicle)->toBeTrue()
        ->and($sale->can_deliver_bpkb)->toBeFalse();

    // 1. Vehicle delivery should succeed
    $response = $this->post(route('handovers.store'), [
        'sale_id' => $sale->id,
        'recipient_name' => 'Ahmad Dani',
        'recipient_relation' => 'buyer_self',
        'officer_name' => 'Staf Showroom',
        'handover_location' => 'Showroom Telaga Berlian',
        'vehicle_delivered_at' => now()->format('Y-m-d H:i:s'),
    ]);

    $response->assertSessionHasNoErrors();
    expect(VehicleHandover::where('sale_id', $sale->id)->first()->status)->toBe('vehicle_delivered');

    // 2. But BPKB delivery should fail if attempted while not settled
    $failBpkbResponse = $this->post(route('handovers.store'), [
        'sale_id' => $sale->id,
        'recipient_name' => 'Ahmad Dani',
        'recipient_relation' => 'buyer_self',
        'officer_name' => 'Staf Showroom',
        'handover_location' => 'Showroom Telaga Berlian',
        'vehicle_delivered_at' => now()->format('Y-m-d H:i:s'),
        'bpkb_delivered_at' => now()->format('Y-m-d H:i:s'),
    ]);

    $failBpkbResponse->assertSessionHasErrors('bpkb_delivered_at');
});

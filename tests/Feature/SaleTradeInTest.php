<?php

use App\Models\Brand;
use App\Models\Car;
use App\Models\Customer;
use App\Models\Sale;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('sales create page provides active brands for trade-in suggestions', function () {
    $user = User::factory()->create();
    Brand::factory()->create(['name' => 'Toyota', 'is_active' => true]);
    Brand::factory()->create(['name' => 'Honda', 'is_active' => true]);
    Brand::factory()->create(['name' => 'Inactive Brand', 'is_active' => false]);

    $this->actingAs($user)
        ->get(route('sales.create'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('sales/create')
            ->has('brands', 2)
            ->where('brands.0.name', 'Honda')
            ->where('brands.1.name', 'Toyota')
        );
});

test('storing trade-in sale requires vehicle details', function () {
    $user = User::factory()->create();
    $car = Car::factory()->create(['status' => 'available', 'selling_price' => 150_000_000]);
    $customer = Customer::factory()->create();

    $this->actingAs($user)
        ->post(route('sales.store'), [
            'car_id' => $car->id,
            'customer_id' => $customer->id,
            'payment_type' => 'trade_in',
            'deal_price' => 150_000_000,
        ])
        ->assertSessionHasErrors([
            'trade_in_license_plate',
            'trade_in_brand',
            'trade_in_car_name',
            'trade_in_year',
            'trade_in_color',
            'trade_in_mileage',
        ]);
});

test('storing trade-in sale persists trade-in vehicle details successfully', function () {
    $user = User::factory()->create();
    $car = Car::factory()->create(['status' => 'available', 'selling_price' => 200_000_000]);
    $customer = Customer::factory()->create();

    $response = $this->actingAs($user)
        ->post(route('sales.store'), [
            'car_id' => $car->id,
            'customer_id' => $customer->id,
            'payment_type' => 'trade_in',
            'deal_price' => 200_000_000,
            'down_payment' => 30_000_000,
            'trade_in_license_plate' => 'DT 1234 AB',
            'trade_in_brand' => 'Toyota',
            'trade_in_car_name' => 'Avanza 1.3 G M/T',
            'trade_in_year' => 2018,
            'trade_in_color' => 'Hitam Metalik',
            'trade_in_mileage' => 45000,
            'trade_in_notes' => 'Pajak hidup, kondisi mulus orisinil.',
            'record_initial_payment' => true,
            'payment_date' => '2026-08-27',
            'payment_method' => 'transfer',
            'destination_account' => 'BCA Showroom (0123-456-789)',
        ]);

    $sale = Sale::query()->latest('id')->first();

    $response->assertRedirect(route('sales.show', $sale));

    expect($sale)->not->toBeNull()
        ->and($sale->payment_type)->toBe('trade_in')
        ->and($sale->deal_price)->toBe(200_000_000)
        ->and($sale->down_payment)->toBe(30_000_000)
        ->and($sale->trade_in_license_plate)->toBe('DT 1234 AB')
        ->and($sale->trade_in_brand)->toBe('Toyota')
        ->and($sale->trade_in_car_name)->toBe('Avanza 1.3 G M/T')
        ->and($sale->trade_in_year)->toBe(2018)
        ->and($sale->trade_in_color)->toBe('Hitam Metalik')
        ->and($sale->trade_in_mileage)->toBe(45000)
        ->and($sale->trade_in_notes)->toBe('Pajak hidup, kondisi mulus orisinil.')
        ->and($sale->payments)->toHaveCount(1)
        ->and($sale->payments->first()->amount)->toBe(30_000_000);
});

test('trade-in sale page renders trade-in card with vehicle details', function () {
    $user = User::factory()->create();
    $sale = Sale::factory()->tradeIn()->create([
        'deal_price' => 180_000_000,
        'down_payment' => 20_000_000,
        'trade_in_license_plate' => 'DT 5678 CD',
        'trade_in_brand' => 'Honda',
        'trade_in_car_name' => 'Brio Satya E M/T',
        'trade_in_year' => 2020,
        'trade_in_color' => 'Putih Mutiara',
        'trade_in_mileage' => 28000,
        'trade_in_notes' => 'Service record dealer resmi.',
    ]);

    $this->actingAs($user)
        ->get(route('sales.show', $sale))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('sales/show')
            ->where('sale.payment_type', 'trade_in')
            ->where('sale.trade_in_license_plate', 'DT 5678 CD')
            ->where('sale.trade_in_brand', 'Honda')
            ->where('sale.trade_in_car_name', 'Brio Satya E M/T')
            ->where('sale.trade_in_year', 2020)
            ->where('sale.trade_in_color', 'Putih Mutiara')
            ->where('sale.trade_in_mileage', 28000)
            ->where('sale.trade_in_notes', 'Service record dealer resmi.')
        );
});

<?php

use App\Models\Brand;
use App\Models\Car;
use App\Models\Customer;
use App\Models\Purchase;
use App\Models\Sale;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('guest cannot access car capital management', function () {
    $purchase = Purchase::factory()->create();

    $this->get(route('purchases.index'))->assertRedirect(route('login'));
    $this->get(route('purchases.create'))->assertRedirect(route('login'));
    $this->get(route('purchases.edit', $purchase))->assertRedirect(route('login'));
});

test('capital page displays vehicle and complete cost breakdown', function () {
    $user = User::factory()->create();
    $brand = Brand::factory()->create(['name' => 'Toyota']);
    $car = Car::factory()->for($brand)->create(['name' => 'Avanza 1.3 G']);
    $purchase = Purchase::factory()->for($car)->create([
        'price' => 200000000,
        'repair_cost' => 5000000,
        'transport_cost' => 1000000,
        'other_cost' => 500000,
    ]);

    $this->actingAs($user)
        ->get(route('purchases.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('purchases/index')
            ->has('purchases', 1)
            ->where('purchases.0.id', $purchase->id)
            ->where('purchases.0.car.name', $car->name)
            ->where('purchases.0.car.brand.name', $brand->name)
            ->where('purchases.0.repair_cost', 5000000)
            ->where('purchases.0.total_capital', 206500000)
        );
});

test('capital create page only provides cars without capital data', function () {
    $user = User::factory()->create();
    $availableCar = Car::factory()->create(['name' => 'Available Car']);
    $usedCar = Car::factory()->create(['name' => 'Used Car']);
    Purchase::factory()->for($usedCar)->create();

    $this->actingAs($user)
        ->get(route('purchases.create'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('purchases/create')
            ->has('cars', 1)
            ->where('cars.0.id', $availableCar->id)
            ->missing('customers')
        );
});

test('authenticated user can create active capital as the single car cost source', function () {
    $user = User::factory()->create();
    $car = Car::factory()->create();

    $this->actingAs($user)
        ->post(route('purchases.store'), [
            'car_id' => $car->id,
            'purchase_date' => '2026-08-22',
            'price' => 250000000,
            'repair_cost' => 7000000,
            'transport_cost' => 1000000,
            'other_cost' => 500000,
            'status' => 'completed',
            'notes' => 'Modal unit siap jual.',
        ])
        ->assertRedirect(route('purchases.index'))
        ->assertSessionHasNoErrors();

    $purchase = Purchase::query()->sole();

    expect($purchase->purchase_number)
        ->toMatch('/^MDL-20260822-[A-Z0-9]{6}$/')
        ->and($purchase->total_capital)->toBe(258500000)
        ->and($car->fresh()->capital?->id)->toBe($purchase->id);
});

test('a car cannot have duplicate capital records', function () {
    $user = User::factory()->create();
    $purchase = Purchase::factory()->create();

    $this->actingAs($user)
        ->post(route('purchases.store'), [
            'car_id' => $purchase->car_id,
            'purchase_date' => '2026-08-22',
            'price' => 200000000,
            'repair_cost' => 0,
            'transport_cost' => 0,
            'other_cost' => 0,
            'status' => 'completed',
        ])
        ->assertSessionHasErrors([
            'car_id' => 'Mobil ini sudah memiliki data modal.',
        ]);
});

test('authenticated user can update capital breakdown', function () {
    $user = User::factory()->create();
    $purchase = Purchase::factory()->create(['status' => 'completed']);

    $this->actingAs($user)
        ->put(route('purchases.update', $purchase), [
            'car_id' => $purchase->car_id,
            'purchase_date' => '2026-08-20',
            'price' => 300000000,
            'repair_cost' => 10000000,
            'transport_cost' => 1500000,
            'other_cost' => 500000,
            'status' => 'completed',
            'notes' => 'Rincian modal sudah final.',
        ])
        ->assertRedirect(route('purchases.index'))
        ->assertSessionHasNoErrors();

    $purchase->refresh();

    expect($purchase->total_capital)->toBe(312000000)
        ->and($purchase->car->capital?->total_capital)->toBe(312000000);
});

test('only cars with active capital are eligible for sale', function () {
    $user = User::factory()->create();
    $car = Car::factory()->create(['status' => 'available']);
    $purchase = Purchase::factory()->for($car)->create(['status' => 'completed']);

    expect(Car::query()->availableForSale()->whereKey($car)->exists())->toBeTrue();

    $this->actingAs($user)
        ->patch(route('purchases.status.update', $purchase), [
            'status' => 'cancelled',
        ])
        ->assertRedirect(route('purchases.index'));

    expect($purchase->fresh()->status)->toBe('cancelled');
    expect(Car::query()->availableForSale()->whereKey($car)->exists())->toBeFalse();

    $purchase->refresh()->update(['status' => 'completed']);

    expect(Car::query()->availableForSale()->whereKey($car)->exists())->toBeTrue();

    $this->actingAs($user)
        ->delete(route('purchases.destroy', $purchase))
        ->assertRedirect(route('purchases.index'));

    $this->assertDatabaseMissing('purchases', ['id' => $purchase->id]);
    expect(Car::query()->availableForSale()->whereKey($car)->exists())->toBeFalse();
});

test('sale creation rejects a car until its capital is active', function () {
    $user = User::factory()->create();
    $customer = Customer::factory()->create();
    $car = Car::factory()->create(['status' => 'available']);
    $capital = Purchase::factory()->for($car)->create(['status' => 'draft']);

    $this->actingAs($user)
        ->get(route('sales.create'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('sales/create')
            ->has('available_cars', 0)
        );

    $this->actingAs($user)
        ->post(route('sales.store'), [
            'car_id' => $car->id,
            'customer_id' => $customer->id,
            'payment_type' => 'cash_full',
            'deal_price' => $car->selling_price,
        ])
        ->assertSessionHasErrors('car_id');

    $capital->update(['status' => 'completed']);

    $this->actingAs($user)
        ->get(route('sales.create'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('available_cars', 1)
            ->where('available_cars.0.id', $car->id)
            ->where('available_cars.0.capital.total_capital', $capital->total_capital)
        );
});

test('capital attached to a sale cannot be deactivated or deleted', function () {
    $user = User::factory()->create();
    $car = Car::factory()->create(['status' => 'available']);
    $capital = Purchase::factory()->for($car)->create(['status' => 'completed']);
    Sale::factory()->for($car)->create();

    $this->actingAs($user)
        ->patch(route('purchases.status.update', $capital), [
            'status' => 'cancelled',
        ]);

    expect($capital->fresh()->status)->toBe('completed');

    $this->actingAs($user)
        ->delete(route('purchases.destroy', $capital));

    $this->assertDatabaseHas('purchases', ['id' => $capital->id]);
});

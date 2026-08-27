<?php

use App\Models\Brand;
use App\Models\Car;
use App\Models\Customer;
use App\Models\Purchase;
use App\Models\Sale;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('car sale eligibility does not depend on capital data or status', function () {
    $car = Car::factory()->create(['status' => 'available']);

    expect(Car::query()->availableForSale()->whereKey($car)->exists())->toBeTrue();

    $capital = Purchase::factory()->for($car)->create(['status' => 'draft']);

    expect(Car::query()->availableForSale()->whereKey($car)->exists())->toBeTrue();

    $capital->update(['status' => 'completed']);

    expect(Car::query()->availableForSale()->whereKey($car)->exists())->toBeTrue();

    $capital->update(['status' => 'cancelled']);

    expect(Car::query()->availableForSale()->whereKey($car)->exists())->toBeTrue();
});

test('sale creation accepts an available car with draft capital', function () {
    $user = User::factory()->create();
    $customer = Customer::factory()->create();
    $car = Car::factory()->create(['status' => 'available']);
    $capital = Purchase::factory()->for($car)->create(['status' => 'draft']);

    $this->actingAs($user)
        ->get(route('sales.create'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('sales/create')
            ->has('available_cars', 1)
            ->where('available_cars.0.id', $car->id)
            ->where('available_cars.0.capital.status', 'draft')
        );

    $this->actingAs($user)
        ->post(route('sales.store'), [
            'car_id' => $car->id,
            'customer_id' => $customer->id,
            'payment_type' => 'cash_full',
            'deal_price' => $car->selling_price,
        ])
        ->assertSessionHasNoErrors();

    expect(Sale::query()->whereBelongsTo($car)->exists())->toBeTrue();
});

test('capital attached to a sale cannot be deactivated from the car form', function () {
    $user = User::factory()->create();
    $car = Car::factory()->create(['status' => 'available']);
    $capital = Purchase::factory()->for($car)->create(['status' => 'completed']);
    Sale::factory()->for($car)->create();

    $this->actingAs($user)
        ->put(route('cars.update', $car), [
            'brand_id' => $car->brand_id,
            'name' => $car->name,
            'license_plate' => $car->license_plate,
            'chassis_number' => $car->chassis_number,
            'engine_number' => $car->engine_number,
            'year' => $car->year,
            'color' => $car->color,
            'transmission' => $car->transmission,
            'fuel_type' => $car->fuel_type,
            'mileage' => $car->mileage,
            'selling_price' => $car->selling_price,
            'status' => $car->status,
            'description' => $car->description,
            'capital' => [
                'purchase_date' => substr((string) $capital->purchase_date, 0, 10),
                'price' => $capital->price,
                'repair_cost' => $capital->repair_cost,
                'transport_cost' => $capital->transport_cost,
                'other_cost' => $capital->other_cost,
                'status' => 'cancelled',
                'notes' => $capital->notes,
            ],
        ])
        ->assertSessionHasErrors('capital.status');

    expect($capital->fresh()->status)->toBe('completed');
});

test('standalone capital management routes are no longer exposed', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->get('/purchases')->assertNotFound();
    $this->actingAs($user)->get('/purchases/create')->assertNotFound();
});

test('draft capital allows empty prices and defaults to zero', function () {
    $user = User::factory()->create();
    $carData = [
        'brand_id' => Brand::factory()->create()->id,
        'name' => 'Toyota Yaris Cross',
        'year' => 2023,
        'transmission' => 'automatic',
        'fuel_type' => 'hybrid',
        'mileage' => 15000,
        'status' => 'available',
        'capital' => [
            'status' => 'draft',
        ],
    ];

    $this->actingAs($user)
        ->post(route('cars.store'), $carData)
        ->assertRedirect(route('cars.index'));

    $createdCar = Car::query()->where('name', 'Toyota Yaris Cross')->first();
    expect($createdCar)->not->toBeNull()
        ->and($createdCar->selling_price)->toBe(0)
        ->and($createdCar->capital->price)->toBe(0)
        ->and($createdCar->capital->status)->toBe('draft');
});

test('active capital requires selling price and purchase price to be greater than zero', function () {
    $user = User::factory()->create();
    $brand = Brand::factory()->create();

    $this->actingAs($user)
        ->post(route('cars.store'), [
            'brand_id' => $brand->id,
            'name' => 'Honda HR-V',
            'year' => 2022,
            'transmission' => 'automatic',
            'fuel_type' => 'bensin',
            'mileage' => 20000,
            'selling_price' => 0,
            'status' => 'available',
            'capital' => [
                'purchase_date' => '2024-01-01',
                'price' => 0,
                'status' => 'completed',
            ],
        ])
        ->assertSessionHasErrors(['selling_price', 'capital.price']);
});

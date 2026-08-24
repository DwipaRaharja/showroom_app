<?php

use App\Models\Brand;
use App\Models\Car;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('guest cannot access car create, detail, and edit pages', function () {
    $car = Car::factory()->create();

    $this->get(route('cars.create'))->assertRedirect(route('login'));
    $this->get(route('cars.show', $car))->assertRedirect(route('login'));
    $this->get(route('cars.edit', $car))->assertRedirect(route('login'));
});

test('authenticated user can view a car on a dedicated detail page', function () {
    $user = User::factory()->create();
    $brand = Brand::factory()->create([
        'name' => 'Toyota',
        'slug' => 'toyota-detail',
    ]);
    $car = Car::factory()->for($brand)->create([
        'name' => 'Innova Zenix',
    ]);
    $capital = $car->capital()->create([
        'purchase_date' => '2026-08-20',
        'price' => 380000000,
        'repair_cost' => 2000000,
        'transport_cost' => 1000000,
        'other_cost' => 0,
        'status' => 'completed',
    ]);
    $car->documents()->create([
        'document_type' => 'stnk',
        'status' => 'complete',
        'owner_name' => 'Budi Santoso',
        'issued_at' => '2026-08-01',
        'expires_at' => '2027-08-01',
    ]);
    $attachment = $car->documentAttachment()->create([
        'file_name' => 'dokumen-mobil.pdf',
        'file_mime' => 'application/pdf',
        'file_size' => 128000,
    ]);

    $this->actingAs($user)
        ->get(route('cars.show', $car))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('cars/show')
            ->where('car.id', $car->id)
            ->where('car.name', 'Innova Zenix')
            ->where('car.brand.name', 'Toyota')
            ->where('car.capital.id', $capital->id)
            ->has('car.documents', 1)
            ->where('car.document_attachment.id', $attachment->id)
        );
});

test('car create page only provides active brands', function () {
    $user = User::factory()->create();
    $activeBrand = Brand::factory()->create([
        'name' => 'Astra Active',
        'slug' => 'astra-active',
        'is_active' => true,
    ]);
    Brand::factory()->create([
        'name' => 'Zebra Inactive',
        'slug' => 'zebra-inactive',
        'is_active' => false,
    ]);

    $this->actingAs($user)
        ->get(route('cars.create'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('cars/create')
            ->has('brands', 1)
            ->where('brands.0.id', $activeBrand->id)
            ->where('brands.0.name', $activeBrand->name)
        );
});

test('car edit page keeps the current inactive brand available', function () {
    $user = User::factory()->create();
    $activeBrand = Brand::factory()->create([
        'name' => 'Astra Active',
        'slug' => 'astra-active',
        'is_active' => true,
    ]);
    $currentBrand = Brand::factory()->create([
        'name' => 'Zebra Current',
        'slug' => 'zebra-current',
        'is_active' => false,
    ]);
    Brand::factory()->create([
        'name' => 'Zebra Other',
        'slug' => 'zebra-other',
        'is_active' => false,
    ]);
    $car = Car::factory()->for($currentBrand)->create();

    $this->actingAs($user)
        ->get(route('cars.edit', $car))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('cars/edit')
            ->where('car.id', $car->id)
            ->where('car.brand_id', $currentBrand->id)
            ->has('brands', 2)
            ->where('brands.0.id', $activeBrand->id)
            ->where('brands.1.id', $currentBrand->id)
        );
});

test('authenticated user can create a car from the dedicated form', function () {
    $user = User::factory()->create();
    $brand = Brand::factory()->create(['is_active' => true]);

    $this->actingAs($user)
        ->post(route('cars.store'), [
            'brand_id' => $brand->id,
            'name' => 'Avanza 1.3 G',
            'license_plate' => 'DD 1234 TB',
            'year' => 2024,
            'color' => 'Hitam',
            'transmission' => 'automatic',
            'fuel_type' => 'bensin',
            'mileage' => 12000,
            'selling_price' => 205000000,
            'status' => 'available',
            'description' => 'Kondisi siap jual.',
            'capital' => [
                'purchase_date' => '2026-08-24',
                'price' => 180000000,
                'repair_cost' => 5000000,
                'transport_cost' => 1000000,
                'other_cost' => 0,
                'status' => 'completed',
                'notes' => 'Modal awal unit.',
            ],
        ])
        ->assertRedirect(route('cars.index'))
        ->assertSessionHasNoErrors();

    $this->assertDatabaseHas('cars', [
        'brand_id' => $brand->id,
        'name' => 'Avanza 1.3 G',
        'license_plate' => 'DD 1234 TB',
        'selling_price' => 205000000,
        'status' => 'available',
    ]);
    $this->assertDatabaseHas('purchases', [
        'price' => 180000000,
        'repair_cost' => 5000000,
        'transport_cost' => 1000000,
        'status' => 'completed',
    ]);
});

test('authenticated user can update a car from the dedicated form', function () {
    $user = User::factory()->create();
    $brand = Brand::factory()->create(['is_active' => true]);
    $car = Car::factory()->for($brand)->create();
    $capital = $car->capital()->create([
        'purchase_date' => '2026-08-20',
        'price' => 380000000,
        'repair_cost' => 0,
        'transport_cost' => 0,
        'other_cost' => 0,
        'status' => 'completed',
    ]);

    $this->actingAs($user)
        ->put(route('cars.update', $car), [
            'brand_id' => $brand->id,
            'name' => 'Innova Zenix 2.0 V',
            'license_plate' => $car->license_plate,
            'year' => 2025,
            'color' => 'Putih Mutiara',
            'transmission' => 'cvt',
            'fuel_type' => 'hybrid',
            'mileage' => 9000,
            'selling_price' => 425000000,
            'status' => 'booked',
            'description' => 'Sudah dibooking customer.',
            'capital' => [
                'purchase_date' => '2026-08-21',
                'price' => 390000000,
                'repair_cost' => 2000000,
                'transport_cost' => 1000000,
                'other_cost' => 500000,
                'status' => 'completed',
                'notes' => 'Modal diperbarui.',
            ],
        ])
        ->assertRedirect(route('cars.show', $car))
        ->assertSessionHasNoErrors();

    $this->assertDatabaseHas('cars', [
        'id' => $car->id,
        'name' => 'Innova Zenix 2.0 V',
        'transmission' => 'cvt',
        'fuel_type' => 'hybrid',
        'selling_price' => 425000000,
        'status' => 'booked',
    ]);
    $this->assertDatabaseHas('purchases', [
        'id' => $capital->id,
        'car_id' => $car->id,
        'price' => 390000000,
        'repair_cost' => 2000000,
        'status' => 'completed',
    ]);
});

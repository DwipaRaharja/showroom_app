<?php

use App\Models\Brand;
use App\Models\Car;
use App\Models\Customer;
use App\Models\Sale;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
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
    Storage::fake('local');

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
            'image' => UploadedFile::fake()
                ->image('avanza-utama.jpg', 1200, 800)
                ->size(1024),
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

    $car = Car::query()->where('license_plate', 'DD 1234 TB')->sole();

    expect($car->image)->not->toBeNull();
    Storage::disk('local')->assertExists($car->image ?? '');

    $this->actingAs($user)
        ->get(route('cars.image', $car))
        ->assertOk()
        ->assertHeader('content-type', 'image/jpeg');
});

test('authenticated user can update a car from the dedicated form', function () {
    Storage::fake('local');

    $user = User::factory()->create();
    $brand = Brand::factory()->create(['is_active' => true]);
    $car = Car::factory()->for($brand)->create(['status' => 'available']);
    $capital = $car->capital()->create([
        'purchase_date' => '2026-08-20',
        'price' => 380000000,
        'repair_cost' => 0,
        'transport_cost' => 0,
        'other_cost' => 0,
        'status' => 'completed',
    ]);
    $oldImagePath = "cars/{$car->id}/images/old-image.jpg";
    Storage::disk('local')->put($oldImagePath, 'old-image');
    $car->update(['image' => $oldImagePath]);

    $this->actingAs($user)
        ->post(route('cars.update', $car), [
            '_method' => 'PUT',
            'brand_id' => $brand->id,
            'name' => 'Innova Zenix 2.0 V',
            'license_plate' => $car->license_plate,
            'year' => 2025,
            'color' => 'Putih Mutiara',
            'transmission' => 'cvt',
            'fuel_type' => 'hybrid',
            'mileage' => 9000,
            'selling_price' => 425000000,
            'status' => 'maintenance',
            'description' => 'Dalam servis berkala.',
            'image' => UploadedFile::fake()
                ->image('innova-baru.jpg', 1200, 800)
                ->size(1024),
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
        'status' => 'maintenance',
    ]);
    $this->assertDatabaseHas('purchases', [
        'id' => $capital->id,
        'car_id' => $car->id,
        'price' => 390000000,
        'repair_cost' => 2000000,
        'status' => 'completed',
    ]);

    $newImagePath = $car->fresh()->image;

    expect($newImagePath)->not->toBeNull()
        ->and($newImagePath)->not->toBe($oldImagePath);
    Storage::disk('local')->assertMissing($oldImagePath);
    Storage::disk('local')->assertExists($newImagePath ?? '');

    $this->actingAs($user)
        ->post(route('cars.update', $car), [
            '_method' => 'PUT',
            'brand_id' => $brand->id,
            'name' => 'Innova Zenix 2.0 V',
            'license_plate' => $car->license_plate,
            'year' => 2025,
            'color' => 'Putih Mutiara',
            'transmission' => 'cvt',
            'fuel_type' => 'hybrid',
            'mileage' => 9000,
            'selling_price' => 425000000,
            'status' => 'maintenance',
            'description' => 'Dalam servis berkala.',
            'remove_image' => true,
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

    expect($car->fresh()->image)->toBeNull();
    Storage::disk('local')->assertMissing($newImagePath ?? '');
});

test('authenticated user can view car listing with status summary metrics', function () {
    $user = User::factory()->create();
    $brand = Brand::factory()->create();

    $car1 = Car::factory()->for($brand)->create(['status' => 'available', 'selling_price' => 200000000]);
    $car1->capital()->create([
        'purchase_date' => '2026-08-01',
        'price' => 150000000,
        'repair_cost' => 10000000,
        'transport_cost' => 2000000,
        'other_cost' => 1000000,
        'status' => 'completed',
    ]);

    $car2 = Car::factory()->for($brand)->create(['status' => 'available', 'selling_price' => 300000000]);
    $car2->capital()->create([
        'purchase_date' => '2026-08-02',
        'price' => 250000000,
        'repair_cost' => 5000000,
        'transport_cost' => 0,
        'other_cost' => 0,
        'status' => 'completed',
    ]);

    $car3 = Car::factory()->for($brand)->create(['status' => 'booked', 'selling_price' => 180000000]);
    $car3->capital()->create([
        'purchase_date' => '2026-08-03',
        'price' => 140000000,
        'repair_cost' => 0,
        'transport_cost' => 0,
        'other_cost' => 0,
        'status' => 'completed',
    ]);

    $car4 = Car::factory()->for($brand)->create(['status' => 'maintenance', 'selling_price' => 120000000]);
    $car4->capital()->create([
        'purchase_date' => '2026-08-04',
        'price' => 90000000,
        'repair_cost' => 10000000,
        'transport_cost' => 0,
        'other_cost' => 0,
        'status' => 'completed',
    ]);

    $car5 = Car::factory()->for($brand)->create(['status' => 'sold', 'selling_price' => 250000000]);
    $car5->capital()->create([
        'purchase_date' => '2026-08-05',
        'price' => 200000000,
        'repair_cost' => 0,
        'transport_cost' => 0,
        'other_cost' => 0,
        'status' => 'completed',
    ]);

    $this->actingAs($user)
        ->get(route('cars.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('cars/index')
            ->has('cars', 5)
            ->where('summary.total_active', 4)
            ->where('summary.available', 2)
            ->where('summary.booked', 1)
            ->where('summary.maintenance', 1)
            ->where('summary.sold', 1)
            ->where('summary.total_active_capital', 658000000)
            ->where('summary.potential_selling_turnover', 500000000)
        );
});

test('authenticated user can toggle car status between available and maintenance', function () {
    $user = User::factory()->create();
    $car = Car::factory()->create(['status' => 'available']);

    $this->actingAs($user)
        ->patch(route('cars.status.update', $car), [
            'status' => 'maintenance',
        ])
        ->assertRedirect(route('cars.show', $car))
        ->assertSessionHasNoErrors();

    expect($car->fresh()->status)->toBe('maintenance');

    $this->actingAs($user)
        ->patch(route('cars.status.update', $car), [
            'status' => 'available',
        ])
        ->assertRedirect(route('cars.show', $car))
        ->assertSessionHasNoErrors();

    expect($car->fresh()->status)->toBe('available');
});

test('authenticated user cannot manually update car status to booked or sold', function () {
    $user = User::factory()->create();
    $car = Car::factory()->create(['status' => 'available']);

    $this->actingAs($user)
        ->patch(route('cars.status.update', $car), [
            'status' => 'sold',
        ])
        ->assertSessionHasErrors('status');

    expect($car->fresh()->status)->toBe('available');

    $this->actingAs($user)
        ->patch(route('cars.status.update', $car), [
            'status' => 'booked',
        ])
        ->assertSessionHasErrors('status');

    expect($car->fresh()->status)->toBe('available');
});

test('authenticated user cannot manually update status of a car linked to a sale', function () {
    $user = User::factory()->create();
    $car = Car::factory()->create(['status' => 'booked']);
    $customer = Customer::factory()->create();
    $sale = Sale::factory()->create([
        'car_id' => $car->id,
        'customer_id' => $customer->id,
        'deal_price' => 200000000,
        'status' => 'pending',
    ]);

    $this->actingAs($user)
        ->patch(route('cars.status.update', $car), [
            'status' => 'available',
        ])
        ->assertSessionHasErrors('status');

    expect($car->fresh()->status)->toBe('booked');
});

test('car creation rejects booked or sold status', function () {
    $user = User::factory()->create();
    $brand = Brand::factory()->create(['is_active' => true]);

    $this->actingAs($user)
        ->post(route('cars.store'), [
            'brand_id' => $brand->id,
            'name' => 'Avanza Test',
            'license_plate' => 'B 9999 XYZ',
            'year' => 2023,
            'transmission' => 'manual',
            'fuel_type' => 'bensin',
            'mileage' => 10000,
            'selling_price' => 180000000,
            'status' => 'sold',
            'capital' => [
                'purchase_date' => '2026-08-24',
                'price' => 150000000,
                'repair_cost' => 0,
                'transport_cost' => 0,
                'other_cost' => 0,
                'status' => 'completed',
            ],
        ])
        ->assertSessionHasErrors('status');
});

<?php

declare(strict_types=1);

use App\Models\Brand;
use App\Models\Car;
use App\Models\Customer;
use App\Models\Sale;
use App\Models\User;
use App\Models\VehicleHandover;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    $this->actingAs(User::factory()->create());
});

/** @return array<string, mixed> */
function validHandoverChecklist(bool $withBpkb = false): array
{
    return [
        'key_count' => 2,
        'has_stnk' => true,
        'has_bpkb' => $withBpkb,
        'has_faktur' => $withBpkb,
        'has_manual_book' => true,
        'has_toolkit' => true,
        'has_spare_tire' => true,
        'fuel_level' => '1/2',
        'cleanliness' => 'Bersih & Salon Siap Pakai',
    ];
}

function createSaleForHandover(int $dealPrice = 100_000_000): Sale
{
    $brand = Brand::query()->create([
        'name' => 'Toyota '.fake()->unique()->numerify('####'),
        'is_active' => true,
    ]);
    $car = Car::query()->create([
        'brand_id' => $brand->id,
        'name' => 'Avanza G',
        'year' => 2024,
        'transmission' => 'automatic',
        'fuel_type' => 'bensin',
        'color' => 'Hitam',
        'mileage' => 12_000,
        'license_plate' => fake()->unique()->bothify('B #### ??'),
        'status' => 'booked',
        'selling_price' => $dealPrice,
    ]);
    $customer = Customer::query()->create([
        'name' => 'Budi Santoso',
        'phone' => '081234567890',
        'ktp_number' => '3201234567890001',
    ]);

    return Sale::query()->create([
        'car_id' => $car->id,
        'customer_id' => $customer->id,
        'payment_type' => 'cash_tempo',
        'deal_price' => $dealPrice,
        'down_payment' => 0,
        'finance_amount' => 0,
        'leasing_bonus' => 0,
        'status' => 'pending',
    ]);
}

/** @return array<string, mixed> */
function validHandoverPayload(Sale $sale): array
{
    return [
        'sale_id' => $sale->id,
        'recipient_name' => 'Budi Santoso',
        'recipient_phone' => '081234567890',
        'recipient_id_card' => '3201234567890001',
        'recipient_relation' => 'buyer_self',
        'officer_name' => 'Admin Showroom',
        'handover_location' => 'Showroom Telaga Berlian',
        'checklist' => validHandoverChecklist(),
    ];
}

function paySaleForHandover(Sale $sale, int $amount): void
{
    $sale->payments()->create([
        'payment_number' => 'KW-TEST-'.fake()->unique()->numerify('######'),
        'payment_date' => now()->toDateString(),
        'payer_type' => 'customer',
        'payment_category' => 'down_payment',
        'amount' => $amount,
        'payment_method' => 'transfer',
        'destination_account' => 'BCA Showroom',
        'status' => 'confirmed',
    ]);
}

test('vehicle delivery is blocked while the remaining bill exceeds ten million', function () {
    $sale = createSaleForHandover();

    $response = $this->post(route('handovers.store'), [
        ...validHandoverPayload($sale),
        'vehicle_delivered_at' => now()->format('Y-m-d H:i:s'),
    ]);

    $response->assertSessionHasErrors('vehicle_delivered_at');
    expect(VehicleHandover::query()->whereBelongsTo($sale)->exists())->toBeFalse();
});

test('a handover cannot be saved without selecting a delivery stage', function () {
    $sale = createSaleForHandover(8_000_000);

    $response = $this->post(
        route('handovers.store'),
        validHandoverPayload($sale),
    );

    $response->assertSessionHasErrors('vehicle_delivered_at');
});

test('vehicle can be delivered with at most ten million remaining while BPKB stays held', function () {
    $sale = createSaleForHandover(100_000_000);
    paySaleForHandover($sale, 92_000_000);

    $response = $this->post(route('handovers.store'), [
        ...validHandoverPayload($sale),
        'vehicle_delivered_at' => now()->format('Y-m-d H:i:s'),
    ]);

    $response->assertSessionHasNoErrors();

    $handover = VehicleHandover::query()->whereBelongsTo($sale)->firstOrFail();

    expect($handover->status)->toBe('vehicle_delivered')
        ->and($handover->vehicle_delivered_at)->not->toBeNull()
        ->and($handover->bpkb_delivered_at)->toBeNull();
});

test('BPKB requires full settlement and a recorded vehicle delivery', function () {
    $sale = createSaleForHandover(100_000_000);
    paySaleForHandover($sale, 92_000_000);

    $response = $this->post(route('handovers.store'), [
        ...validHandoverPayload($sale),
        'bpkb_delivered_at' => now()->format('Y-m-d H:i:s'),
        'bpkb_recipient_type' => 'customer',
        'checklist' => validHandoverChecklist(true),
    ]);

    $response->assertSessionHasErrors('bpkb_delivered_at');
});

test('a settled sale may record both delivery stages and print its BAST', function () {
    $sale = createSaleForHandover(100_000_000);
    paySaleForHandover($sale, 100_000_000);
    $deliveredAt = now()->subMinute()->format('Y-m-d H:i:s');

    $response = $this->post(route('handovers.store'), [
        ...validHandoverPayload($sale),
        'vehicle_delivered_at' => $deliveredAt,
        'bpkb_delivered_at' => now()->format('Y-m-d H:i:s'),
        'bpkb_recipient_type' => 'customer',
        'checklist' => validHandoverChecklist(true),
    ]);

    $response->assertSessionHasNoErrors();

    $handover = VehicleHandover::query()->whereBelongsTo($sale)->firstOrFail();

    expect($handover->status)->toBe('completed');

    $this->get(route('sales.bast.print', $sale))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('sales/bast-print')
            ->where('handover.id', $handover->id));
});

test('BAST cannot be opened before a vehicle delivery is recorded', function () {
    $sale = createSaleForHandover(8_000_000);

    $this->get(route('sales.bast.print', $sale))->assertNotFound();
});

test('proof of handover is stored privately and can be downloaded', function () {
    Storage::fake('local');
    $sale = createSaleForHandover(8_000_000);

    $response = $this->post(route('handovers.store'), [
        ...validHandoverPayload($sale),
        'vehicle_delivered_at' => now()->format('Y-m-d H:i:s'),
        'proof_file' => UploadedFile::fake()->create(
            'bukti-serah-terima.pdf',
            100,
            'application/pdf',
        ),
    ]);

    $response->assertSessionHasNoErrors();

    $handover = VehicleHandover::query()->whereBelongsTo($sale)->firstOrFail();

    expect($handover->proof_file)->not->toBeNull();
    Storage::disk('local')->assertExists($handover->proof_file);

    $this->get(route('handovers.proof.download', $handover))->assertOk();
});

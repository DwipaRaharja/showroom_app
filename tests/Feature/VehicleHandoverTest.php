<?php

declare(strict_types=1);

use App\Models\Brand;
use App\Models\Car;
use App\Models\Customer;
use App\Models\FinanceCompany;
use App\Models\Sale;
use App\Models\User;
use App\Models\VehicleHandover;
use App\Models\VehicleHandoverPhoto;
use Carbon\Carbon;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Storage::fake('local');
    $this->actingAs(User::factory()->create());
});

afterEach(function () {
    Carbon::setTestNow();
});

function createSaleForHandover(int $dealPrice = 100_000_000): Sale
{
    $brandName = 'Toyota '.fake()->unique()->numerify('####');
    $brand = Brand::query()->create([
        'name' => $brandName,
        'slug' => str($brandName)->slug()->toString(),
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

function createCreditSaleForHandover(
    int $dealPrice = 100_000_000,
    int $financeAmount = 80_000_000,
): Sale {
    $sale = createSaleForHandover($dealPrice);

    $sale->update([
        'finance_company_id' => FinanceCompany::factory()->create()->id,
        'payment_type' => 'credit',
        'down_payment' => max(0, $dealPrice - $financeAmount),
        'finance_amount' => $financeAmount,
        'disbursement_estimated_date' => now()->addDays(3)->toDateString(),
    ]);

    return $sale->fresh(['payments']);
}

/**
 * @param  array<int, string>  $items
 * @param  array<int, UploadedFile>|null  $photos
 * @return array<string, mixed>
 */
function validHandoverTrackingPayload(
    Sale $sale,
    array $items = ['vehicle', 'stnk', 'keys'],
    ?array $photos = null,
    ?string $occurredAt = null,
): array {
    $payload = [
        'sale_id' => $sale->id,
        'occurred_at' => $occurredAt ?? now()->format('Y-m-d H:i:s'),
        'items' => $items,
        'recipient_name' => 'Budi Santoso',
        'recipient_phone' => '081234567890',
        'recipient_id_card' => '3201234567890001',
        'recipient_relation' => 'buyer_self',
        'officer_name' => 'Admin Showroom',
        'handover_location' => 'Showroom Telaga Berlian',
        'photos' => $photos ?? [UploadedFile::fake()->image('bukti.jpg')],
    ];

    if (in_array('keys', $items, true)) {
        $payload['key_count'] = 2;
    }

    if (in_array('vehicle', $items, true)) {
        $payload['vehicle_condition'] = [
            'fuel_level' => '1/2',
            'cleanliness' => 'Bersih & Salon Siap Pakai',
        ];
    }

    return $payload;
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

test('a new sale automatically appears in handover management', function () {
    $sale = createSaleForHandover();

    $this->get(route('handovers.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('handovers/index')
            ->where('sales.0.id', $sale->id)
            ->where('sales.0.handover', null));

    expect(VehicleHandover::query()->whereBelongsTo($sale)->exists())
        ->toBeFalse();
});

test('tracking history and tracking form use separate pages', function () {
    $sale = createSaleForHandover(8_000_000);

    $this->get(route('handovers.show', $sale))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('handovers/show')
            ->where('sale.id', $sale->id));

    $this->get(route('handovers.create', $sale))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('handovers/create')
            ->where('sale.id', $sale->id));
});

test('vehicle delivery is permitted for active sale regardless of remaining bill', function () {
    $sale = createSaleForHandover(100_000_000); // 100M remaining

    $this->post(
        route('handovers.store'),
        validHandoverTrackingPayload($sale, ['vehicle', 'stnk', 'keys']),
    )->assertSessionHasNoErrors();

    expect(VehicleHandover::query()->whereBelongsTo($sale)->exists())->toBeTrue();
});

test('a tracking event requires at least one delivered item and one photo', function () {
    $sale = createSaleForHandover(8_000_000);
    $payload = validHandoverTrackingPayload($sale);
    $payload['items'] = [];
    $payload['photos'] = [];

    $this->post(route('handovers.store'), $payload)
        ->assertSessionHasErrors(['items', 'photos']);
});

test('vehicle delivery creates an immutable event with items recipient and photos', function () {
    $sale = createSaleForHandover(100_000_000);
    paySaleForHandover($sale, 92_000_000);

    $this->post(
        route('handovers.store'),
        validHandoverTrackingPayload($sale),
    )->assertSessionHasNoErrors()
        ->assertRedirect(route('handovers.show', $sale));

    $handover = VehicleHandover::query()
        ->with(['events.items', 'events.photos'])
        ->whereBelongsTo($sale)
        ->firstOrFail();
    $event = $handover->events->sole();

    expect($handover->status)->toBe('vehicle_delivered')
        ->and($event->recipient_name)->toBe('Budi Santoso')
        ->and($event->items->pluck('item_code')->all())
        ->toBe(['vehicle', 'stnk', 'keys'])
        ->and($event->photos)->toHaveCount(1)
        ->and($handover->hasDeliveredItem('vehicle'))->toBeTrue()
        ->and($handover->hasDeliveredItem('bpkb'))->toBeFalse();
});

test('datetime-local is interpreted as Makassar time before UTC validation', function () {
    Carbon::setTestNow(Carbon::create(2026, 8, 24, 14, 31, 0, 'UTC'));
    $sale = createSaleForHandover(8_000_000);

    $this->post(
        route('handovers.store'),
        validHandoverTrackingPayload(
            $sale,
            occurredAt: '2026-08-24T22:30',
        ),
    )->assertSessionHasNoErrors();

    $event = VehicleHandover::query()
        ->whereBelongsTo($sale)
        ->firstOrFail()
        ->events()
        ->firstOrFail();

    expect($event->occurred_at->utc()->format('Y-m-d H:i:s'))
        ->toBe('2026-08-24 14:30:00');
});

test('BPKB requires settlement a vehicle event and the invoice', function () {
    $sale = createSaleForHandover(100_000_000);
    paySaleForHandover($sale, 92_000_000);

    $this->post(
        route('handovers.store'),
        validHandoverTrackingPayload($sale, ['bpkb', 'invoice']),
    )->assertSessionHasErrors('items');

    paySaleForHandover($sale, 8_000_000);

    $this->post(
        route('handovers.store'),
        validHandoverTrackingPayload($sale, ['bpkb', 'invoice']),
    )->assertSessionHasErrors('items');

    expect(VehicleHandover::query()->whereBelongsTo($sale)->exists())->toBeFalse();
});

test('a settled sale can record separate vehicle and document timeline events', function () {
    $sale = createSaleForHandover(100_000_000);
    paySaleForHandover($sale, 100_000_000);

    $this->post(
        route('handovers.store'),
        validHandoverTrackingPayload(
            $sale,
            ['vehicle', 'stnk', 'keys'],
            null,
            now()->subMinute()->format('Y-m-d H:i:s'),
        ),
    )->assertSessionHasNoErrors();

    $documentPayload = validHandoverTrackingPayload($sale, [
        'bpkb',
        'invoice',
    ]);
    $documentPayload['recipient_name'] = 'Andi Petugas Leasing';
    $documentPayload['recipient_phone'] = '081298765432';
    $documentPayload['recipient_id_card'] = null;
    $documentPayload['recipient_relation'] = 'leasing_officer';

    $this->post(
        route('handovers.store'),
        $documentPayload,
    )->assertSessionHasNoErrors();

    $handover = VehicleHandover::query()
        ->with(['events.items', 'events.photos'])
        ->whereBelongsTo($sale)
        ->firstOrFail();

    expect($handover->status)->toBe('completed')
        ->and($handover->events)->toHaveCount(2)
        ->and($handover->events->pluck('recipient_name')->all())
        ->toBe(['Budi Santoso', 'Andi Petugas Leasing'])
        ->and($handover->hasDeliveredItem('vehicle'))->toBeTrue()
        ->and($handover->hasDeliveredItem('bpkb'))->toBeTrue();

    $this->get(route('sales.bast.print', $sale))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('sales/bast-print')
            ->where('handover.id', $handover->id)
            ->has('handover.events', 2));
});

test('credit sale becomes sold when BPKB handover confirms the leasing disbursement', function () {
    $sale = createCreditSaleForHandover();
    paySaleForHandover($sale, 20_000_000);

    $sale = $sale->fresh(['payments', 'car']);

    expect($sale->status)->toBe('partial')
        ->and($sale->car->status)->toBe('booked')
        ->and($sale->remaining_bill)->toBe(80_000_000)
        ->and($sale->remaining_finance_disbursement)->toBe(80_000_000)
        ->and($sale->customer_payment_shortfall)->toBe(0)
        ->and($sale->can_deliver_vehicle)->toBeTrue()
        ->and($sale->can_deliver_bpkb)->toBeTrue();

    $this->post(
        route('handovers.store'),
        validHandoverTrackingPayload(
            $sale,
            ['vehicle', 'stnk', 'keys'],
            null,
            now()->subMinute()->format('Y-m-d H:i:s'),
        ),
    )->assertSessionHasNoErrors();

    $this->post(
        route('handovers.store'),
        validHandoverTrackingPayload($sale, ['bpkb', 'invoice']),
    )->assertSessionHasErrors('recipient_relation');

    expect($sale->payments()->where(
        'payment_category',
        'finance_disbursement',
    )->exists())->toBeFalse();

    $documentPayload = validHandoverTrackingPayload($sale, [
        'bpkb',
        'invoice',
    ]);
    $documentPayload['recipient_name'] = 'Andi Petugas Leasing';
    $documentPayload['recipient_relation'] = 'leasing_officer';
    $documentPayload['handover_location'] = 'Kantor leasing';

    $this->post(route('handovers.store'), $documentPayload)
        ->assertSessionHasNoErrors();

    $sale = $sale->fresh(['payments', 'car', 'handover.events.items']);
    $financePayment = $sale->payments
        ->where('payment_category', 'finance_disbursement')
        ->sole();

    expect($financePayment->payer_type)->toBe('finance')
        ->and($financePayment->amount)->toBe(80_000_000)
        ->and($financePayment->status)->toBe('confirmed')
        ->and($financePayment->reference_number)->toStartWith('BPKB-')
        ->and($sale->remaining_bill)->toBe(0)
        ->and($sale->status)->toBe('completed')
        ->and($sale->car->status)->toBe('sold')
        ->and($sale->disbursement_actual_date)->not->toBeNull()
        ->and($sale->handover?->hasDeliveredItem('bpkb'))->toBeTrue();

    $this->delete(route('payments.destroy', $financePayment))
        ->assertSessionHasErrors('payment');

    $sale = $sale->fresh(['payments', 'car']);

    expect($sale->payments->contains($financePayment))->toBeTrue()
        ->and($sale->status)->toBe('completed')
        ->and($sale->car->status)->toBe('sold');
});

test('credit handover allows vehicle delivery but keeps BPKB blocked while the customer portion is unpaid', function () {
    $sale = createCreditSaleForHandover();

    expect($sale->remaining_bill)->toBe(100_000_000)
        ->and($sale->remaining_finance_disbursement)->toBe(80_000_000)
        ->and($sale->customer_payment_shortfall)->toBe(20_000_000)
        ->and($sale->can_deliver_vehicle)->toBeTrue()
        ->and($sale->can_deliver_bpkb)->toBeFalse()
        ->and($sale->car->status)->toBe('booked');

    // Vehicle delivery is allowed
    $this->post(
        route('handovers.store'),
        validHandoverTrackingPayload($sale, ['vehicle', 'stnk', 'keys']),
    )->assertSessionHasNoErrors();

    // BPKB delivery remains blocked
    $this->post(
        route('handovers.store'),
        validHandoverTrackingPayload($sale, ['bpkb', 'invoice']),
    )->assertSessionHasErrors('recipient_relation');

    expect($sale->payments()->where(
        'payment_category',
        'finance_disbursement',
    )->exists())->toBeFalse();
});

test('leasing principal cannot be recorded manually before BPKB handover', function () {
    $sale = createCreditSaleForHandover();
    paySaleForHandover($sale, 20_000_000);

    $this->post(route('payments.store', $sale), [
        'payment_date' => now()->toDateString(),
        'payer_type' => 'finance',
        'payment_category' => 'finance_disbursement',
        'amount' => 80_000_000,
        'payment_method' => 'transfer',
        'destination_account' => 'BCA Showroom',
    ])->assertSessionHasErrors('payment_category');

    $sale = $sale->fresh(['payments', 'car']);

    expect($sale->payments()->where(
        'payment_category',
        'finance_disbursement',
    )->exists())->toBeFalse()
        ->and($sale->status)->toBe('partial')
        ->and($sale->car->status)->toBe('booked');
});

test('an item that has already been handed over cannot be recorded twice', function () {
    $sale = createSaleForHandover(8_000_000);

    $this->post(
        route('handovers.store'),
        validHandoverTrackingPayload($sale),
    )->assertSessionHasNoErrors();

    $this->post(
        route('handovers.store'),
        validHandoverTrackingPayload($sale, ['stnk']),
    )->assertSessionHasErrors('items');

    expect(
        VehicleHandover::query()
            ->whereBelongsTo($sale)
            ->firstOrFail()
            ->events()
            ->count(),
    )->toBe(1);
});

test('BAST cannot be opened before a vehicle delivery event exists', function () {
    $sale = createSaleForHandover(8_000_000);

    $this->get(route('sales.bast.print', $sale))->assertNotFound();
});

test('multiple handover photos are stored privately and can be downloaded', function () {
    $sale = createSaleForHandover(8_000_000);

    $this->post(route('handovers.store'), validHandoverTrackingPayload(
        $sale,
        ['vehicle', 'stnk'],
        [
            UploadedFile::fake()->image('depan.jpg'),
            UploadedFile::fake()->image('penerima.png'),
        ],
    ))->assertSessionHasNoErrors();

    $photos = VehicleHandoverPhoto::query()->orderBy('id')->get();

    expect($photos)->toHaveCount(2);

    foreach ($photos as $photo) {
        Storage::disk('local')->assertExists($photo->file_path);
        $this->get(route('handover-photos.show', $photo))
            ->assertOk()
            ->assertHeader('content-type', $photo->file_mime);
        $this->get(route('handover-photos.download', $photo))
            ->assertOk()
            ->assertDownload($photo->file_name);
    }
});

<?php

use App\Models\Car;
use App\Models\Customer;
use App\Models\Payment;
use App\Models\Purchase;
use App\Models\Sale;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('archiving a sold car preserves all transaction and document relations', function () {
    $user = User::factory()->create();
    $car = Car::factory()->create(['status' => 'available']);

    $purchase = Purchase::factory()->for($car)->create([
        'status' => 'completed',
    ]);

    $document = $car->documents()->create([
        'document_type' => 'stnk',
        'document_number' => 'STNK-ARCHIVE-001',
        'owner_name' => 'Pemilik Arsip',
        'status' => 'complete',
        'original_received' => true,
    ]);

    $sale = Sale::query()->create([
        'car_id' => $car->id,
        'customer_id' => Customer::factory()->create()->id,
        'payment_type' => 'cash_full',
        'deal_price' => 200_000_000,
        'down_payment' => 200_000_000,
        'finance_amount' => 0,
        'leasing_bonus' => 0,
        'status' => 'pending',
    ]);

    $payment = Payment::query()->create([
        'sale_id' => $sale->id,
        'payment_date' => '2026-08-22',
        'payer_type' => 'customer',
        'payment_category' => 'settlement',
        'amount' => 200_000_000,
        'payment_method' => 'transfer',
        'destination_account' => 'BCA Showroom',
        'status' => 'confirmed',
    ]);

    expect($car->fresh()->status)->toBe('sold');

    $this->actingAs($user)
        ->delete(route('cars.destroy', $car))
        ->assertRedirect(route('cars.index'));

    $this->assertSoftDeleted('cars', ['id' => $car->id]);
    $this->assertDatabaseHas('purchases', ['id' => $purchase->id]);
    $this->assertDatabaseHas('sales', ['id' => $sale->id]);
    $this->assertDatabaseHas('payments', ['id' => $payment->id]);
    $this->assertDatabaseHas('vehicle_documents', ['id' => $document->id]);

    expect(Car::query()->find($car->id))->toBeNull()
        ->and(Car::withTrashed()->find($car->id)?->trashed())->toBeTrue()
        ->and($sale->fresh()->car?->id)->toBe($car->id)
        ->and($sale->fresh()->car?->trashed())->toBeTrue()
        ->and($purchase->fresh()->car?->id)->toBe($car->id)
        ->and($document->fresh()->car?->id)->toBe($car->id);

    $this->actingAs($user)
        ->get(route('sales.show', $sale))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('sale.car.id', $car->id)
            ->where('sale.car.name', $car->name)
        );

    $this->actingAs($user)
        ->get(route('cars.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->has('cars', 0));
});

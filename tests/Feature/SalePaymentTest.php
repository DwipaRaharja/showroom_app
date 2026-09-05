<?php

use App\Models\Car;
use App\Models\Customer;
use App\Models\Payment;
use App\Models\Sale;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

function createTempoSale(array $attributes = []): Sale
{
    $car = Car::factory()->create(['status' => 'available']);

    $sale = Sale::query()->create(array_merge([
        'car_id' => $car->id,
        'customer_id' => Customer::factory()->create()->id,
        'payment_type' => 'cash_tempo',
        'deal_price' => 100_000_000,
        'down_payment' => 0,
        'finance_amount' => 0,
        'leasing_bonus' => 0,
        'due_date' => '2026-09-22',
        'status' => 'pending',
    ], $attributes));

    $sale->refreshSettlementStatus();

    return $sale->fresh(['car', 'payments']);
}

function paymentPayload(array $attributes = []): array
{
    return array_merge([
        'payment_date' => '2026-08-22',
        'payer_type' => 'customer',
        'payment_category' => 'installment',
        'amount' => 10_000_000,
        'payment_method' => 'transfer',
        'destination_account' => 'BCA Showroom',
    ], $attributes);
}

test('unpaid tempo sale books the car and fully paid sale marks it as sold', function () {
    $user = User::factory()->create();
    $sale = createTempoSale();

    expect($sale->status)->toBe('pending')
        ->and($sale->car->status)->toBe('booked');

    $this->actingAs($user)
        ->post(route('payments.store', $sale), paymentPayload([
            'payment_category' => 'down_payment',
            'amount' => 20_000_000,
        ]))
        ->assertSessionHasNoErrors();

    expect($sale->fresh()->status)->toBe('partial')
        ->and($sale->car->fresh()->status)->toBe('booked');

    $this->actingAs($user)
        ->post(route('payments.store', $sale), paymentPayload([
            'payment_category' => 'settlement',
            'amount' => 80_000_000,
        ]))
        ->assertSessionHasNoErrors();

    $sale->refresh();

    expect($sale->status)->toBe('completed')
        ->and($sale->car->fresh()->status)->toBe('sold')
        ->and($sale->remaining_bill)->toBe(0)
        ->and($sale->can_accept_payment)->toBeFalse();

    $this->actingAs($user)
        ->get(route('sales.show', $sale))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('sale.status', 'completed')
            ->where('sale.car.status', 'sold')
            ->where('sale.can_accept_payment', false)
        );
});

test('tempo sale only accepts one down payment', function () {
    $user = User::factory()->create();
    $sale = createTempoSale();

    $payload = paymentPayload([
        'payment_category' => 'down_payment',
        'amount' => 20_000_000,
    ]);

    $this->actingAs($user)
        ->post(route('payments.store', $sale), $payload)
        ->assertSessionHasNoErrors();

    $this->actingAs($user)
        ->post(route('payments.store', $sale), $payload)
        ->assertSessionHasErrors([
            'payment_category' => 'Pembayaran DP / booking sudah pernah dicatat untuk penjualan ini.',
        ]);

    expect($sale->payments()->where('payment_category', 'down_payment')->count())
        ->toBe(1)
        ->and($sale->fresh(['payments'])->has_down_payment)->toBeTrue();
});

test('tempo sale requires down payment before an installment', function () {
    $user = User::factory()->create();
    $sale = createTempoSale();

    $this->actingAs($user)
        ->post(route('payments.store', $sale), paymentPayload([
            'payment_category' => 'installment',
            'amount' => 10_000_000,
        ]))
        ->assertSessionHasErrors([
            'payment_category' => 'Catat pembayaran DP / booking terlebih dahulu sebelum menambahkan angsuran.',
        ]);

    expect($sale->payments()->count())->toBe(0)
        ->and($sale->fresh()->status)->toBe('pending')
        ->and($sale->car->fresh()->status)->toBe('booked');
});

test('fully paid sale rejects another payment', function () {
    $user = User::factory()->create();
    $sale = createTempoSale();

    $this->actingAs($user)
        ->post(route('payments.store', $sale), paymentPayload([
            'payment_category' => 'settlement',
            'amount' => 100_000_000,
        ]))
        ->assertSessionHasNoErrors();

    $this->actingAs($user)
        ->post(route('payments.store', $sale), paymentPayload([
            'amount' => 1_000_000,
        ]))
        ->assertSessionHasErrors([
            'amount' => 'Penjualan ini sudah lunas dan tidak dapat menerima pembayaran lagi.',
        ]);

    expect($sale->payments()->count())->toBe(1);
});

test('payment cannot exceed the remaining bill', function () {
    $user = User::factory()->create();
    $sale = createTempoSale();

    $this->actingAs($user)
        ->post(route('payments.store', $sale), paymentPayload([
            'amount' => 100_000_001,
        ]))
        ->assertSessionHasErrors([
            'amount' => 'Nominal pembayaran tidak boleh melebihi sisa tagihan sebesar Rp 100.000.000.',
        ]);

    expect($sale->payments()->count())->toBe(0)
        ->and($sale->fresh()->status)->toBe('pending')
        ->and($sale->car->fresh()->status)->toBe('booked');
});

test('deleting a settlement returns the sale and car to unpaid status', function () {
    $user = User::factory()->create();
    $sale = createTempoSale();

    $this->actingAs($user)
        ->post(route('payments.store', $sale), paymentPayload([
            'payment_category' => 'settlement',
            'amount' => 100_000_000,
        ]))
        ->assertSessionHasNoErrors();

    $payment = Payment::query()->whereBelongsTo($sale)->sole();

    expect($sale->fresh()->status)->toBe('completed')
        ->and($sale->car->fresh()->status)->toBe('sold');

    $this->actingAs($user)
        ->delete(route('payments.destroy', $payment))
        ->assertSessionHasNoErrors();

    expect($sale->fresh()->status)->toBe('pending')
        ->and($sale->car->fresh()->status)->toBe('booked');
});

test('cannot create a sale for a car that is already sold or booked', function () {
    $user = User::factory()->create();
    $car = Car::factory()->create(['status' => 'available']);
    $customer = Customer::factory()->create();

    // First sale succeeds
    $this->actingAs($user)
        ->post(route('sales.store'), [
            'car_id' => $car->id,
            'customer_id' => $customer->id,
            'payment_type' => 'cash_full',
            'deal_price' => 150_000_000,
        ])
        ->assertSessionHasNoErrors();

    expect($car->fresh()->status)->toBe('sold');

    // Second simultaneous attempt fails with validation error
    $customer2 = Customer::factory()->create();
    $this->actingAs($user)
        ->post(route('sales.store'), [
            'car_id' => $car->id,
            'customer_id' => $customer2->id,
            'payment_type' => 'cash_full',
            'deal_price' => 150_000_000,
        ])
        ->assertSessionHasErrors(['car_id']);
});

test('cancelling a sale updates status to cancelled, restores car to available, and preserves records in database', function () {
    $user = User::factory()->create();
    $sale = createTempoSale();

    // Record down payment
    $this->actingAs($user)
        ->post(route('payments.store', $sale), paymentPayload([
            'payment_category' => 'down_payment',
            'amount' => 20_000_000,
        ]))
        ->assertSessionHasNoErrors();

    expect($sale->fresh()->status)->toBe('partial')
        ->and($sale->car->fresh()->status)->toBe('booked')
        ->and($sale->payments()->count())->toBe(1);

    // Cancel the sale with a reason
    $this->actingAs($user)
        ->post(route('sales.cancel', $sale), [
            'reason' => 'Pengajuan kredit ditolak oleh leasing',
        ])
        ->assertSessionHasNoErrors();

    $freshSale = $sale->fresh(['car', 'payments']);

    // Record is NOT deleted
    expect($freshSale)->not->toBeNull()
        ->and($freshSale->status)->toBe('cancelled')
        ->and($freshSale->notes)->toContain('[Dibatalkan: Pengajuan kredit ditolak oleh leasing]')
        ->and($freshSale->car->status)->toBe('available')
        ->and($freshSale->payments->count())->toBe(1)
        ->and($freshSale->can_accept_payment)->toBeFalse();

    // Attempting to add a payment to a cancelled sale must be rejected
    $this->actingAs($user)
        ->post(route('payments.store', $freshSale), paymentPayload([
            'payment_category' => 'installment',
            'amount' => 10_000_000,
        ]))
        ->assertSessionHasErrors();
});

test('cash payment does not require destination account and defaults to Kas Tunai Showroom', function () {
    $user = User::factory()->create();
    $sale = createTempoSale();

    $this->actingAs($user)
        ->post(route('payments.store', $sale), [
            'payment_date' => '2026-09-05',
            'payer_type' => 'customer',
            'payment_category' => 'down_payment',
            'amount' => 20_000_000,
            'payment_method' => 'cash',
        ])
        ->assertSessionHasNoErrors();

    $payment = $sale->payments()->first();
    expect($payment)->not->toBeNull()
        ->and($payment->payment_method)->toBe('cash')
        ->and($payment->destination_account)->toBe('Kas Tunai Showroom');
});

test('transfer payment requires destination account', function () {
    $user = User::factory()->create();
    $sale = createTempoSale();

    $this->actingAs($user)
        ->post(route('payments.store', $sale), [
            'payment_date' => '2026-09-05',
            'payer_type' => 'customer',
            'payment_category' => 'down_payment',
            'amount' => 20_000_000,
            'payment_method' => 'transfer',
            'destination_account' => '',
        ])
        ->assertSessionHasErrors(['destination_account']);
});

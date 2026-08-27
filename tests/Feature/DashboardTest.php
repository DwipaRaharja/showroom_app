<?php

use App\Models\Car;
use App\Models\Customer;
use App\Models\Payment;
use App\Models\Purchase;
use App\Models\Sale;
use App\Models\User;
use App\Models\VehicleDocument;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected to the login page', function () {
    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('login'));
});

test('authenticated users can visit the dashboard', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $response = $this->get(route('dashboard'));
    $response->assertOk();
});

test('dashboard summarizes current business data and prioritizes actionable items', function () {
    Carbon::setTestNow(Carbon::parse('2026-08-26 10:00:00', 'Asia/Makassar'));

    $user = User::factory()->create();
    $readyCar = Car::factory()->create([
        'name' => 'Avanza 1.3 G',
        'license_plate' => 'KT 1234 TB',
        'selling_price' => 135_000_000,
        'status' => 'available',
        'created_at' => '2026-06-01 09:00:00',
    ]);

    Purchase::factory()->for($readyCar)->create([
        'purchase_date' => '2026-06-01',
        'price' => 100_000_000,
        'repair_cost' => 0,
        'transport_cost' => 0,
        'other_cost' => 0,
        'document_process_cost' => 0,
        'status' => 'completed',
    ]);

    VehicleDocument::factory()->for($readyCar)->create([
        'document_type' => 'stnk',
        'annual_tax_due_at' => '2026-08-20',
        'expires_at' => '2026-10-01',
        'status' => 'complete',
    ]);
    VehicleDocument::factory()->for($readyCar)->create([
        'document_type' => 'bpkb',
        'annual_tax_due_at' => null,
        'expires_at' => null,
        'status' => 'ready',
    ]);
    VehicleDocument::factory()->for($readyCar)->create([
        'document_type' => 'invoice',
        'annual_tax_due_at' => null,
        'expires_at' => null,
        'status' => 'ready',
    ]);

    $bookedCar = Car::factory()->create([
        'status' => 'booked',
        'selling_price' => 120_000_000,
    ]);
    $customer = Customer::factory()->create(['name' => 'Budi Santoso']);
    $sale = Sale::factory()->for($bookedCar)->for($customer)->create([
        'payment_type' => 'cash_tempo',
        'deal_price' => 100_000_000,
        'down_payment' => 20_000_000,
        'finance_amount' => 0,
        'finance_company_id' => null,
        'due_date' => '2026-08-25',
        'status' => 'partial',
        'created_at' => '2026-08-10 09:00:00',
        'updated_at' => '2026-08-10 09:00:00',
    ]);

    Payment::factory()->for($sale)->create([
        'payment_date' => '2026-08-10',
        'payer_type' => 'customer',
        'payment_category' => 'down_payment',
        'amount' => 20_000_000,
        'status' => 'confirmed',
    ]);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard')
            ->where('summary.available', 1)
            ->where('summary.booked', 1)
            ->where('summary.maintenance', 0)
            ->where('summary.sales_this_month', 1)
            ->where('summary.turnover_this_month', 100_000_000)
            ->where('summary.payments_this_month', 20_000_000)
            ->where('summary.active_capital', 100_000_000)
            ->where('summary.incomplete_capital', 1)
            ->where('summary.customer_receivables', 80_000_000)
            ->where('summary.finance_receivables', 0)
            ->has('attention.financial', 1)
            ->where('attention.financial.0.kind', 'payment_overdue')
            ->where('attention.financial.0.amount', 80_000_000)
            ->has('document_reminders', 2)
            ->where('document_reminders.0.kind', 'annual_tax')
            ->where('performance.5.key', '2026-08')
            ->where('performance.5.turnover', 100_000_000)
            ->where('performance.5.payments', 20_000_000)
            ->where('stock_aging.0.id', $readyCar->id)
            ->where('recent_sales.0.id', $sale->id));

    Carbon::setTestNow();
});

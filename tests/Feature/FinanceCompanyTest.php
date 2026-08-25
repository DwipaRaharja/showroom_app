<?php

declare(strict_types=1);

use App\Models\Car;
use App\Models\Customer;
use App\Models\FinanceCompany;
use App\Models\Purchase;
use App\Models\Sale;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('guest cannot access finance companies index', function () {
    $response = $this->get(route('finance-companies.index'));

    $response->assertRedirect(route('login'));
});

test('authenticated user can view finance companies index with summary', function () {
    $user = User::factory()->create();
    FinanceCompany::factory()->count(3)->create();

    $response = $this->actingAs($user)->get(route('finance-companies.index'));

    $response->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('finance-companies/index')
            ->has('finance_companies', 3)
            ->has('summary', fn (Assert $summary) => $summary
                ->where('total', 3)
                ->has('active')
                ->has('inactive')
                ->has('total_sales_financed')
            )
        );
});

test('leasing transaction totals only include credit sales', function () {
    $user = User::factory()->create();
    $company = FinanceCompany::factory()->create();

    Sale::factory()->create([
        'payment_type' => 'credit',
        'finance_company_id' => $company->id,
    ]);
    Sale::factory()->create([
        'payment_type' => 'cash_full',
        'finance_company_id' => $company->id,
    ]);

    $this->actingAs($user)
        ->get(route('finance-companies.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('finance_companies.0.id', $company->id)
            ->where('finance_companies.0.sales_count', 1)
            ->where('summary.total_sales_financed', 1)
        );
});

test('inactive leasing cannot be used for a new credit sale', function () {
    $user = User::factory()->create();
    $company = FinanceCompany::factory()->create(['is_active' => false]);
    $car = Car::factory()->create(['status' => 'available']);
    $customer = Customer::factory()->create();

    Purchase::factory()->for($car)->create(['status' => 'completed']);

    $this->actingAs($user)
        ->post(route('sales.store'), [
            'car_id' => $car->id,
            'customer_id' => $customer->id,
            'payment_type' => 'credit',
            'deal_price' => 150_000_000,
            'down_payment' => 30_000_000,
            'finance_company_id' => $company->id,
            'finance_amount' => 120_000_000,
            'leasing_bonus' => 0,
        ])
        ->assertSessionHasErrors('finance_company_id');

    $this->assertDatabaseMissing('sales', [
        'car_id' => $car->id,
        'finance_company_id' => $company->id,
    ]);
});

test('authenticated user can store a new finance company', function () {
    $user = User::factory()->create();

    $payload = [
        'name' => 'BCA Finance Cabang Surabaya',
        'code' => 'bcaf',
        'pic_name' => 'Hendro Setiawan',
        'pic_phone' => '081234567890',
        'is_active' => true,
        'notes' => 'Bunga promo 2026 tenor 4 tahun.',
    ];

    $response = $this->actingAs($user)->post(route('finance-companies.store'), $payload);

    $response->assertRedirect(route('finance-companies.index'));

    $this->assertDatabaseHas('finance_companies', [
        'name' => 'BCA Finance Cabang Surabaya',
        'code' => 'BCAF',
        'pic_name' => 'Hendro Setiawan',
        'pic_phone' => '081234567890',
        'is_active' => true,
    ]);
});

test('authenticated user can store an inactive finance company from checkbox value', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->post(route('finance-companies.store'), [
        'name' => 'Leasing Nonaktif',
        'is_active' => '0',
    ]);

    $response->assertRedirect(route('finance-companies.index'));

    $this->assertDatabaseHas('finance_companies', [
        'name' => 'Leasing Nonaktif',
        'is_active' => false,
    ]);
});

test('finance company status validation uses a friendly message', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->post(route('finance-companies.store'), [
        'name' => 'Leasing Status Tidak Valid',
        'is_active' => 'nilai-tidak-valid',
    ]);

    $response->assertSessionHasErrors([
        'is_active' => 'Pilih status rekanan: aktif atau tidak aktif.',
    ]);

    $this->assertDatabaseMissing('finance_companies', [
        'name' => 'Leasing Status Tidak Valid',
    ]);
});

test('store finance company validates unique name', function () {
    $user = User::factory()->create();
    FinanceCompany::factory()->create(['name' => 'Mandiri Utama Finance']);

    $response = $this->actingAs($user)->post(route('finance-companies.store'), [
        'name' => 'Mandiri Utama Finance',
    ]);

    $response->assertSessionHasErrors(['name']);
});

test('authenticated user can update finance company', function () {
    $user = User::factory()->create();
    $company = FinanceCompany::factory()->create([
        'name' => 'Adira Finance',
        'code' => 'ADR',
        'pic_name' => 'Lama',
    ]);

    $payload = [
        'name' => 'Adira Dinamika Multi Finance',
        'code' => 'ADIRA',
        'pic_name' => 'PIC Baru',
        'pic_phone' => '081999888777',
        'is_active' => true,
        'notes' => 'Catatan diperbarui.',
    ];

    $response = $this->actingAs($user)->put(route('finance-companies.update', $company), $payload);

    $response->assertRedirect(route('finance-companies.index'));

    $this->assertDatabaseHas('finance_companies', [
        'id' => $company->id,
        'name' => 'Adira Dinamika Multi Finance',
        'code' => 'ADIRA',
        'pic_name' => 'PIC Baru',
    ]);
});

test('authenticated user can toggle finance company active status', function () {
    $user = User::factory()->create();
    $company = FinanceCompany::factory()->create(['is_active' => true]);

    $response = $this->actingAs($user)->patch(route('finance-companies.status.update', $company));

    $response->assertRedirect(route('finance-companies.index'));

    expect($company->fresh()->is_active)->toBeFalse();

    $this->actingAs($user)->patch(route('finance-companies.status.update', $company));

    expect($company->fresh()->is_active)->toBeTrue();
});

test('authenticated user can delete finance company without sales', function () {
    $user = User::factory()->create();
    $company = FinanceCompany::factory()->create();

    $response = $this->actingAs($user)->delete(route('finance-companies.destroy', $company));

    $response->assertRedirect(route('finance-companies.index'));

    $this->assertDatabaseMissing('finance_companies', [
        'id' => $company->id,
    ]);
});

test('finance company with sales cannot be deleted', function () {
    $user = User::factory()->create();
    $company = FinanceCompany::factory()->create();
    $car = Car::factory()->create();
    $customer = Customer::factory()->create();

    Sale::factory()->create([
        'car_id' => $car->id,
        'customer_id' => $customer->id,
        'payment_type' => 'credit',
        'finance_company_id' => $company->id,
    ]);

    $response = $this->actingAs($user)->delete(route('finance-companies.destroy', $company));

    $this->assertDatabaseHas('finance_companies', [
        'id' => $company->id,
    ]);
});

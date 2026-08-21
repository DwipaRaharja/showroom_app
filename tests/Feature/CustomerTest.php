<?php

use App\Models\Customer;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('guest cannot access customer management', function () {
    $customer = Customer::factory()->create();

    $this->get(route('customers.index'))->assertRedirect(route('login'));
    $this->delete(route('customers.destroy', $customer))->assertRedirect(route('login'));
});

test('customer page includes active and archived data', function () {
    $user = User::factory()->create();
    $activeCustomer = Customer::factory()->create();
    $archivedCustomer = Customer::factory()->create();
    $archivedCustomer->delete();

    $this->actingAs($user)
        ->get(route('customers.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('customers/index')
            ->has('customers', 2)
            ->where('customers.0.id', $archivedCustomer->id)
            ->where('customers.0.deleted_at', fn ($value) => $value !== null)
            ->where('customers.1.id', $activeCustomer->id)
            ->where('customers.1.deleted_at', null)
        );
});

test('authenticated user can create a normalized customer', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('customers.store'), [
            'name' => '  Budi   Santoso  ',
            'phone' => '(0812) 3456-7890',
            'ktp_number' => '3201-2345-6789-0001',
            'address' => '  Jl. Sudirman No. 123  ',
        ])
        ->assertRedirect(route('customers.index'))
        ->assertSessionHasNoErrors();

    $this->assertDatabaseHas('customers', [
        'name' => 'Budi Santoso',
        'phone' => '+6281234567890',
        'ktp_number' => '3201234567890001',
        'address' => 'Jl. Sudirman No. 123',
    ]);
});

test('phone and nik must use valid formats', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('customers.store'), [
            'name' => 'Budi Santoso',
            'phone' => 'telepon-invalid',
            'ktp_number' => '12345',
        ])
        ->assertSessionHasErrors([
            'phone' => 'Nomor telepon harus menggunakan format Indonesia yang valid, contoh 081234567890.',
            'ktp_number' => 'Nomor KTP / NIK harus terdiri dari tepat 16 digit.',
        ]);
});

test('normalized phone and nik must be unique', function () {
    $user = User::factory()->create();
    Customer::factory()->create([
        'phone' => '+6281234567890',
        'ktp_number' => '3201234567890001',
    ]);

    $this->actingAs($user)
        ->post(route('customers.store'), [
            'name' => 'Customer Lain',
            'phone' => '0812-3456-7890',
            'ktp_number' => '3201 2345 6789 0001',
        ])
        ->assertSessionHasErrors(['phone', 'ktp_number']);
});

test('duplicate archived customer directs the user to restore it', function () {
    $user = User::factory()->create();
    $customer = Customer::factory()->create([
        'phone' => '+6281234567890',
        'ktp_number' => '3201234567890001',
    ]);
    $customer->delete();

    $this->actingAs($user)
        ->post(route('customers.store'), [
            'name' => 'Customer Lain',
            'phone' => '0812-3456-7890',
            'ktp_number' => '3201 2345 6789 0001',
        ])
        ->assertSessionHasErrors([
            'phone' => 'Nomor telepon / WhatsApp sudah digunakan oleh customer yang diarsipkan. Pulihkan data tersebut melalui filter Diarsipkan.',
            'ktp_number' => 'Nomor KTP / NIK sudah digunakan oleh customer yang diarsipkan. Pulihkan data tersebut melalui filter Diarsipkan.',
        ]);
});

test('authenticated user can update a customer', function () {
    $user = User::factory()->create();
    $customer = Customer::factory()->create();

    $this->actingAs($user)
        ->put(route('customers.update', $customer), [
            'name' => 'Siti Aminah',
            'phone' => '0813 9876 5432',
            'ktp_number' => $customer->ktp_number,
            'address' => 'Makassar',
        ])
        ->assertRedirect(route('customers.index'))
        ->assertSessionHasNoErrors();

    $this->assertDatabaseHas('customers', [
        'id' => $customer->id,
        'name' => 'Siti Aminah',
        'phone' => '+6281398765432',
        'ktp_number' => $customer->ktp_number,
        'address' => 'Makassar',
    ]);
});

test('customer can be archived and restored', function () {
    $user = User::factory()->create();
    $customer = Customer::factory()->create();

    $this->actingAs($user)
        ->delete(route('customers.destroy', $customer))
        ->assertRedirect(route('customers.index'));

    $this->assertSoftDeleted($customer);

    $this->actingAs($user)
        ->patch(route('customers.restore', $customer->id))
        ->assertRedirect(route('customers.index'));

    $this->assertNotSoftDeleted($customer);
});

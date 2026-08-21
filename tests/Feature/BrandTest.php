<?php

use App\Models\Brand;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('brand page displays brand data', function () {
    $user = User::factory()->create();
    $brand = Brand::factory()->create();

    $this->actingAs($user)
        ->get(route('brands.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('brands/index')
            ->has('brands', 1)
            ->where('brands.0.id', $brand->id)
            ->where('brands.0.name', $brand->name)
            ->where('brands.0.slug', $brand->slug)
        );
});

test('authenticated user can create a brand', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('brands.store'), [
            'name' => 'Mercedes-Benz',
            'is_active' => true,
        ])
        ->assertRedirect(route('brands.index'))
        ->assertSessionHasNoErrors();

    $this->assertDatabaseHas('brands', [
        'name' => 'Mercedes-Benz',
        'slug' => 'mercedes-benz',
        'is_active' => true,
    ]);
});

test('active duplicate brand returns a contextual validation message', function () {
    $user = User::factory()->create();
    $brand = Brand::factory()->create([
        'name' => 'Toyota',
        'slug' => 'toyota',
        'is_active' => true,
    ]);

    $this->actingAs($user)
        ->post(route('brands.store'), [
            'name' => $brand->name,
            'is_active' => true,
        ])
        ->assertSessionHasErrors([
            'name' => 'Merek ini sudah terdaftar dan berstatus aktif.',
            'slug' => 'Merek ini sudah terdaftar dan berstatus aktif.',
        ]);
});

test('inactive duplicate brand directs the user to reactivate it', function () {
    $user = User::factory()->create();
    $brand = Brand::factory()->create([
        'name' => 'Toyota',
        'slug' => 'toyota',
        'is_active' => false,
    ]);

    $this->actingAs($user)
        ->post(route('brands.store'), [
            'name' => $brand->name,
            'is_active' => true,
        ])
        ->assertSessionHasErrors([
            'name' => 'Merek ini sudah terdaftar tetapi sedang nonaktif. Aktifkan kembali melalui filter Tidak aktif.',
            'slug' => 'Merek ini sudah terdaftar tetapi sedang nonaktif. Aktifkan kembali melalui filter Tidak aktif.',
        ]);
});

test('authenticated user can update a brand', function () {
    $user = User::factory()->create();
    $brand = Brand::factory()->create();

    $this->actingAs($user)
        ->put(route('brands.update', $brand), [
            'name' => 'BMW Indonesia',
            'is_active' => false,
        ])
        ->assertRedirect(route('brands.index'))
        ->assertSessionHasNoErrors();

    $this->assertDatabaseHas('brands', [
        'id' => $brand->id,
        'name' => 'BMW Indonesia',
        'slug' => 'bmw-indonesia',
        'is_active' => false,
    ]);
});

test('authenticated user can toggle a brand status', function () {
    $user = User::factory()->create();
    $brand = Brand::factory()->create(['is_active' => true]);

    $this->actingAs($user)
        ->patch(route('brands.status.update', $brand))
        ->assertRedirect(route('brands.index'));

    expect($brand->fresh()->is_active)->toBeFalse();

    $this->actingAs($user)
        ->patch(route('brands.status.update', $brand))
        ->assertRedirect(route('brands.index'));

    expect($brand->fresh()->is_active)->toBeTrue();
});

test('authenticated user can delete a brand', function () {
    $user = User::factory()->create();
    $brand = Brand::factory()->create();

    $this->actingAs($user)
        ->delete(route('brands.destroy', $brand))
        ->assertRedirect(route('brands.index'));

    $this->assertDatabaseMissing('brands', ['id' => $brand->id]);
});

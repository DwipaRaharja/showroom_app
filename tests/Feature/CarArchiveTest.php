<?php

use App\Models\Car;
use App\Models\Customer;
use App\Models\DocumentProcess;
use App\Models\Payment;
use App\Models\Purchase;
use App\Models\Sale;
use App\Models\User;
use Illuminate\Support\Facades\Storage;
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
        ->assertInertia(fn (Assert $page) => $page
            ->has('cars', 1)
            ->where('cars.0.id', $car->id)
            ->where('cars.0.deleted_at', fn ($deletedAt) => $deletedAt !== null)
            ->where('summary.total_active', 0)
        );

    $this->actingAs($user)
        ->patch(route('cars.restore', $car->id))
        ->assertRedirect(route('cars.index'));

    $this->assertNotSoftDeleted('cars', ['id' => $car->id]);
    expect($car->fresh()->trashed())->toBeFalse();
});

test('cars index inertia response includes sales_count and document_processes_count', function () {
    $user = User::factory()->create();
    $car = Car::factory()->create(['status' => 'available']);

    $this->actingAs($user)
        ->get(route('cars.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('cars', 1)
            ->where('cars.0.id', $car->id)
            ->where('cars.0.sales_count', 0)
            ->where('cars.0.document_processes_count', 0)
        );
});

test('force deleting an archived car with sales is rejected', function () {
    $user = User::factory()->create();
    $car = Car::factory()->create(['status' => 'available']);
    Sale::query()->create([
        'car_id' => $car->id,
        'customer_id' => Customer::factory()->create()->id,
        'payment_type' => 'cash_full',
        'deal_price' => 150_000_000,
        'down_payment' => 150_000_000,
        'finance_amount' => 0,
        'leasing_bonus' => 0,
        'status' => 'pending',
    ]);

    $car->delete();
    expect($car->fresh()->trashed())->toBeTrue();

    $this->actingAs($user)
        ->delete(route('cars.force-delete', $car->id))
        ->assertRedirect(route('cars.index'));

    $this->assertDatabaseHas('cars', ['id' => $car->id]);
    expect(Car::withTrashed()->find($car->id))->not->toBeNull();
});

test('force deleting an archived car with document processes is rejected', function () {
    $user = User::factory()->create();
    $car = Car::factory()->create(['status' => 'available']);
    DocumentProcess::query()->create([
        'car_id' => $car->id,
        'created_by' => $user->id,
        'process_type' => 'annual_tax',
        'status' => 'processing',
        'started_at' => now()->toDateString(),
    ]);

    $car->delete();
    expect($car->fresh()->trashed())->toBeTrue();

    $this->actingAs($user)
        ->delete(route('cars.force-delete', $car->id))
        ->assertRedirect(route('cars.index'));

    $this->assertDatabaseHas('cars', ['id' => $car->id]);
    expect(Car::withTrashed()->find($car->id))->not->toBeNull();
});

test('force deleting an archived car without relations permanently removes it and cleans up storage', function () {
    Storage::fake('local');

    $user = User::factory()->create();
    $car = Car::factory()->create(['status' => 'available']);

    $imagePath = "cars/{$car->id}/foto.jpg";
    Storage::disk('local')->put($imagePath, 'fake-content');
    $car->update(['image' => $imagePath]);

    $purchase = Purchase::factory()->for($car)->create([
        'status' => 'completed',
    ]);

    $document = $car->documents()->create([
        'document_type' => 'stnk',
        'document_number' => 'STNK-001',
        'status' => 'complete',
        'original_received' => true,
    ]);

    $attachmentPath = "car-documents/{$car->id}/attachment.pdf";
    Storage::disk('local')->put($attachmentPath, 'fake-pdf');
    $car->documentAttachment()->create([
        'file_path' => $attachmentPath,
        'file_name' => 'attachment.pdf',
        'file_mime' => 'application/pdf',
        'file_size' => 1024,
    ]);

    $car->delete();
    expect($car->fresh()->trashed())->toBeTrue();

    $this->actingAs($user)
        ->delete(route('cars.force-delete', $car->id))
        ->assertRedirect(route('cars.index'));

    $this->assertDatabaseMissing('cars', ['id' => $car->id]);
    $this->assertDatabaseMissing('purchases', ['id' => $purchase->id]);
    $this->assertDatabaseMissing('vehicle_documents', ['id' => $document->id]);
    $this->assertDatabaseMissing('vehicle_document_attachments', ['car_id' => $car->id]);

    Storage::disk('local')->assertMissing($imagePath);
    Storage::disk('local')->assertMissing($attachmentPath);
});

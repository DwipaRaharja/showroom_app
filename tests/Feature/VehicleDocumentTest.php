<?php

use App\Models\Car;
use App\Models\User;
use App\Models\VehicleDocument;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

test('guest cannot manage vehicle documents', function () {
    $car = Car::factory()->create();
    $document = VehicleDocument::factory()->for($car)->create();

    $this->post(route('vehicle-documents.store', $car), [])
        ->assertRedirect(route('login'));
    $this->get(route('vehicle-documents.download', $document))
        ->assertRedirect(route('login'));
});

test('car index provides document metadata without exposing private paths', function () {
    $user = User::factory()->create();
    $car = Car::factory()->create();
    $document = VehicleDocument::factory()->for($car)->create([
        'document_type' => 'stnk',
        'file_path' => "vehicle-documents/{$car->id}/private.pdf",
        'file_name' => 'stnk.pdf',
    ]);

    $this->actingAs($user)
        ->get(route('cars.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('cars/index')
            ->where('cars.0.id', $car->id)
            ->where('cars.0.documents.0.id', $document->id)
            ->where('cars.0.documents.0.document_type', 'stnk')
            ->missing('cars.0.documents.0.file_path')
        );
});

test('authenticated user can store a private vehicle document', function () {
    Storage::fake('local');

    $user = User::factory()->create();
    $car = Car::factory()->create();
    $file = UploadedFile::fake()->create('stnk.pdf', 128, 'application/pdf');

    $this->actingAs($user)
        ->post(route('vehicle-documents.store', $car), [
            'document_type' => 'stnk',
            'document_number' => 'STNK-001',
            'owner_name' => 'Budi Santoso',
            'issued_at' => '2025-08-22',
            'expires_at' => '2027-08-22',
            'status' => 'complete',
            'original_received' => true,
            'file' => $file,
            'notes' => 'Disimpan di brankas utama.',
        ])
        ->assertRedirect(route('cars.index'))
        ->assertSessionHasNoErrors();

    $document = VehicleDocument::query()->whereBelongsTo($car)->sole();

    expect($document->file_path)->not->toBeNull();
    Storage::disk('local')->assertExists($document->file_path);
    $this->assertDatabaseHas('vehicle_documents', [
        'car_id' => $car->id,
        'document_type' => 'stnk',
        'document_number' => 'STNK-001',
        'status' => 'complete',
        'original_received' => true,
        'file_name' => 'stnk.pdf',
    ]);
});

test('a car cannot have duplicate vehicle document types', function () {
    $user = User::factory()->create();
    $car = Car::factory()->create();
    VehicleDocument::factory()->for($car)->create(['document_type' => 'bpkb']);

    $this->actingAs($user)
        ->post(route('vehicle-documents.store', $car), [
            'document_type' => 'bpkb',
            'status' => 'pending',
            'original_received' => false,
        ])
        ->assertSessionHasErrors('document_type');

    expect($car->documents()->count())->toBe(1);
});

test('authenticated user can update metadata and replace a vehicle document file', function () {
    Storage::fake('local');

    $user = User::factory()->create();
    $car = Car::factory()->create();
    $oldPath = "vehicle-documents/{$car->id}/old.pdf";
    Storage::disk('local')->put($oldPath, 'old-content');
    $document = VehicleDocument::factory()->for($car)->create([
        'document_type' => 'invoice',
        'file_path' => $oldPath,
        'file_name' => 'old.pdf',
        'file_mime' => 'application/pdf',
        'file_size' => 11,
    ]);

    $this->actingAs($user)
        ->put(route('vehicle-documents.update', $document), [
            'document_type' => 'invoice',
            'document_number' => 'FAKTUR-NEW',
            'status' => 'complete',
            'original_received' => true,
            'file' => UploadedFile::fake()->image('faktur-baru.jpg'),
        ])
        ->assertRedirect(route('cars.index'))
        ->assertSessionHasNoErrors();

    $document->refresh();

    expect($document->document_number)->toBe('FAKTUR-NEW')
        ->and($document->file_name)->toBe('faktur-baru.jpg')
        ->and($document->file_path)->not->toBe($oldPath);
    Storage::disk('local')->assertMissing($oldPath);
    Storage::disk('local')->assertExists($document->file_path);
});

test('authenticated user can download a private vehicle document', function () {
    Storage::fake('local');

    $user = User::factory()->create();
    $car = Car::factory()->create();
    $path = "vehicle-documents/{$car->id}/bpkb.pdf";
    Storage::disk('local')->put($path, 'private-bpkb');
    $document = VehicleDocument::factory()->for($car)->create([
        'document_type' => 'bpkb',
        'file_path' => $path,
        'file_name' => 'BPKB.pdf',
        'file_mime' => 'application/pdf',
        'file_size' => 12,
    ]);

    $this->actingAs($user)
        ->get(route('vehicle-documents.download', $document))
        ->assertOk()
        ->assertDownload('BPKB.pdf');
});

test('deleting a vehicle document also removes its private file', function () {
    Storage::fake('local');

    $user = User::factory()->create();
    $car = Car::factory()->create();
    $path = "vehicle-documents/{$car->id}/receipt.pdf";
    Storage::disk('local')->put($path, 'receipt');
    $document = VehicleDocument::factory()->for($car)->create([
        'document_type' => 'receipt',
        'file_path' => $path,
        'file_name' => 'receipt.pdf',
    ]);

    $this->actingAs($user)
        ->delete(route('vehicle-documents.destroy', $document))
        ->assertRedirect(route('cars.index'));

    $this->assertDatabaseMissing('vehicle_documents', ['id' => $document->id]);
    Storage::disk('local')->assertMissing($path);
});

<?php

use App\Models\Car;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

/** @return array<string, mixed> */
function validVehicleDocumentPayload(): array
{
    return [
        'stnk' => [
            'status' => 'complete',
            'owner_name' => 'Budi Santoso',
            'issued_at' => '2025-08-22',
            'expires_at' => '2027-08-22',
        ],
        'bpkb' => [
            'status' => 'ready',
            'owner_name' => 'Budi Santoso',
            'issued_at' => '2025-09-01',
        ],
        'invoice' => [
            'status' => 'ready',
        ],
    ];
}

test('guest cannot manage vehicle documents', function () {
    $car = Car::factory()->create();

    $this->post(route('vehicle-documents.store', $car), [])
        ->assertRedirect(route('login'));
    $this->get(route('vehicle-documents.download', $car))
        ->assertRedirect(route('login'));
});

test('car index provides specialized document metadata without exposing private paths', function () {
    $user = User::factory()->create();
    $car = Car::factory()->create();
    $document = $car->documents()->create([
        'document_type' => 'stnk',
        'owner_name' => 'Budi Santoso',
        'issued_at' => '2025-08-22',
        'expires_at' => '2027-08-22',
        'status' => 'complete',
        'original_received' => true,
    ]);
    $attachment = $car->documentAttachment()->create([
        'file_path' => "vehicle-documents/{$car->id}/shared/private.pdf",
        'file_name' => 'dokumen-mobil.pdf',
        'file_mime' => 'application/pdf',
        'file_size' => 128,
    ]);

    $this->actingAs($user)
        ->get(route('cars.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('cars/index')
            ->where('cars.0.id', $car->id)
            ->where('cars.0.documents.0.id', $document->id)
            ->where('cars.0.documents.0.document_type', 'stnk')
            ->where('cars.0.document_attachment.id', $attachment->id)
            ->where('cars.0.document_attachment.file_name', 'dokumen-mobil.pdf')
            ->missing('cars.0.document_attachment.file_path')
        );
});

test('authenticated user stores stnk bpkb invoice and one shared private file', function () {
    Storage::fake('local');

    $user = User::factory()->create();
    $car = Car::factory()->create();
    $payload = validVehicleDocumentPayload();
    $payload['file'] = UploadedFile::fake()->create(
        'dokumen-mobil.pdf',
        128,
        'application/pdf',
    );

    $this->actingAs($user)
        ->post(route('vehicle-documents.store', $car), $payload)
        ->assertRedirect(route('cars.show', $car))
        ->assertSessionHasNoErrors();

    expect($car->documents()->count())->toBe(3);

    $this->assertDatabaseHas('vehicle_documents', [
        'car_id' => $car->id,
        'document_type' => 'stnk',
        'owner_name' => 'Budi Santoso',
        'status' => 'complete',
        'original_received' => true,
    ]);
    $this->assertDatabaseHas('vehicle_documents', [
        'car_id' => $car->id,
        'document_type' => 'bpkb',
        'status' => 'ready',
        'original_received' => true,
    ]);
    $this->assertDatabaseHas('vehicle_documents', [
        'car_id' => $car->id,
        'document_type' => 'invoice',
        'status' => 'ready',
        'owner_name' => null,
        'issued_at' => null,
    ]);

    $attachment = $car->documentAttachment()->sole();

    expect($attachment->file_name)->toStartWith('dokumen-kendaraan-')
        ->and($attachment->file_name)->toEndWith('.pdf')
        ->and($attachment->file_path)->not->toBeNull();
    Storage::disk('local')->assertExists($attachment->file_path);
});

test('complete stnk and printed bpkb require their detailed metadata', function () {
    $user = User::factory()->create();
    $car = Car::factory()->create();

    $this->actingAs($user)
        ->post(route('vehicle-documents.store', $car), [
            'stnk' => ['status' => 'complete'],
            'bpkb' => ['status' => 'ready'],
            'invoice' => ['status' => 'not_ready'],
        ])
        ->assertSessionHasErrors([
            'stnk.owner_name',
            'stnk.issued_at',
            'stnk.expires_at',
            'bpkb.owner_name',
            'bpkb.issued_at',
        ]);

    expect($car->documents()->count())->toBe(0);
});

test('saving the form again updates metadata and replaces the one shared file', function () {
    Storage::fake('local');

    $user = User::factory()->create();
    $car = Car::factory()->create();
    $firstPayload = validVehicleDocumentPayload();
    $firstPayload['file'] = UploadedFile::fake()->create(
        'lama.pdf',
        64,
        'application/pdf',
    );

    $this->actingAs($user)
        ->post(route('vehicle-documents.store', $car), $firstPayload)
        ->assertSessionHasNoErrors();

    $oldPath = $car->documentAttachment()->sole()->file_path;
    $secondPayload = validVehicleDocumentPayload();
    $secondPayload['stnk']['status'] = 'printing';
    $secondPayload['stnk']['owner_name'] = null;
    $secondPayload['stnk']['issued_at'] = null;
    $secondPayload['stnk']['expires_at'] = null;
    $secondPayload['invoice']['status'] = 'not_ready';
    $secondPayload['file'] = UploadedFile::fake()->image('baru.jpg');

    $this->actingAs($user)
        ->post(route('vehicle-documents.store', $car), $secondPayload)
        ->assertRedirect(route('cars.show', $car))
        ->assertSessionHasNoErrors();

    $attachment = $car->documentAttachment()->sole();

    expect($car->documents()->count())->toBe(3)
        ->and($car->documents()->where('document_type', 'stnk')->sole()->status)
        ->toBe('printing')
        ->and($attachment->file_name)->toStartWith('dokumen-kendaraan-')
        ->and($attachment->file_name)->toEndWith('.jpg')
        ->and($attachment->file_path)->not->toBe($oldPath);
    Storage::disk('local')->assertMissing($oldPath);
    Storage::disk('local')->assertExists($attachment->file_path);
});

test('authenticated user can download the shared private document file', function () {
    Storage::fake('local');

    $user = User::factory()->create();
    $car = Car::factory()->create();
    $path = "vehicle-documents/{$car->id}/shared/dokumen.pdf";
    Storage::disk('local')->put($path, 'private-documents');
    $car->documentAttachment()->create([
        'file_path' => $path,
        'file_name' => 'Dokumen Mobil.pdf',
        'file_mime' => 'application/pdf',
        'file_size' => 17,
    ]);

    $this->actingAs($user)
        ->get(route('vehicle-documents.download', $car))
        ->assertOk()
        ->assertDownload('Dokumen Mobil.pdf');
});

test('shared file can be removed without deleting document metadata', function () {
    Storage::fake('local');

    $user = User::factory()->create();
    $car = Car::factory()->create();
    $path = "vehicle-documents/{$car->id}/shared/dokumen.pdf";
    Storage::disk('local')->put($path, 'private-documents');
    $car->documentAttachment()->create([
        'file_path' => $path,
        'file_name' => 'Dokumen Mobil.pdf',
    ]);
    $payload = validVehicleDocumentPayload();
    $payload['remove_file'] = true;

    $this->actingAs($user)
        ->post(route('vehicle-documents.store', $car), $payload)
        ->assertRedirect(route('cars.show', $car))
        ->assertSessionHasNoErrors();

    $attachment = $car->documentAttachment()->sole();

    expect($car->documents()->count())->toBe(3)
        ->and($attachment->file_path)->toBeNull()
        ->and($attachment->file_name)->toBeNull();
    Storage::disk('local')->assertMissing($path);
});

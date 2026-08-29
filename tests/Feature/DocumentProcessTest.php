<?php

use App\Models\Car;
use App\Models\DocumentProcess;
use App\Models\DocumentProcessDeletionAudit;
use App\Models\Purchase;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

function createCarWithCapital(): Car
{
    $car = Car::factory()->create(['status' => 'available']);

    Purchase::factory()->create([
        'car_id' => $car->id,
        'price' => 100_000_000,
        'repair_cost' => 2_000_000,
        'transport_cost' => 1_000_000,
        'other_cost' => 500_000,
        'document_process_cost' => 0,
        'status' => 'completed',
    ]);

    return $car;
}

/** @return array<string, mixed> */
function validDocumentProcessPayload(Car $car): array
{
    return [
        'car_id' => $car->id,
        'process_type' => 'annual_tax',
        'started_at' => now()->toDateString(),
        'estimated_completion_date' => now()->addDays(5)->toDateString(),
        'notes' => 'Pengurusan pajak tahunan.',
        'initial_cost' => 100_000,
        'initial_cost_paid_by' => 'customer',
    ];
}

test('guest cannot access document process management', function () {
    $this->get(route('document-processes.index'))
        ->assertRedirect(route('login'));
    $this->get(route('document-processes.create'))
        ->assertRedirect(route('login'));
});

test('user creates a process with requirements timeline and capitalized initial cost', function () {
    $user = User::factory()->create();
    $car = createCarWithCapital();
    $payload = [
        ...validDocumentProcessPayload($car),
        'initial_cost' => 1_500_000,
        'initial_cost_paid_by' => 'showroom',
    ];

    $this->actingAs($user)
        ->post(route('document-processes.store'), $payload)
        ->assertSessionHasNoErrors();

    $process = DocumentProcess::query()->sole();

    expect($process->process_number)->toStartWith('BRK-')
        ->and($process->processor_name)->toBeNull()
        ->and($process->processor_phone)->toBeNull()
        ->and($process->items()->count())->toBe(2)
        ->and($process->events()->count())->toBe(1)
        ->and($process->costs()->sole()->cost_type)->toBe('other')
        ->and((int) $process->costs()->sum('amount'))->toBe(1_500_000)
        ->and($car->capital?->fresh()->document_process_cost)->toBe(1_500_000)
        ->and($car->capital?->fresh()->total_capital)->toBe(105_000_000);

    $this->assertDatabaseHas('document_process_items', [
        'document_process_id' => $process->id,
        'item_key' => 'stnk',
        'custody_status' => 'waiting',
    ]);
});

test('create page can preselect a vehicle from its detail page', function () {
    $user = User::factory()->create();
    $car = createCarWithCapital();

    $this->actingAs($user)
        ->get(route('document-processes.create', ['car_id' => $car->id]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('document-processes/create')
            ->where('selected_car_id', $car->id)
            ->where('cars.0.id', $car->id)
            ->has('type_options.annual_tax')
        );
});

test('initial process cost is required when creating a document process', function () {
    $user = User::factory()->create();
    $car = createCarWithCapital();
    $payload = validDocumentProcessPayload($car);
    unset(
        $payload['initial_cost'],
        $payload['initial_cost_paid_by'],
    );

    $this->actingAs($user)
        ->post(route('document-processes.store'), $payload)
        ->assertSessionHasErrors([
            'initial_cost',
            'initial_cost_paid_by',
        ]);

    expect(DocumentProcess::query()->count())->toBe(0);
});

test('same car cannot start another active document process with a different type', function () {
    $user = User::factory()->create();
    $car = createCarWithCapital();

    $this->actingAs($user)
        ->post(route('document-processes.store'), validDocumentProcessPayload($car))
        ->assertSessionHasNoErrors();

    $activeProcess = DocumentProcess::query()->sole();

    $this->actingAs($user)
        ->post(route('document-processes.store'), [
            ...validDocumentProcessPayload($car),
            'process_type' => 'other',
        ])
        ->assertSessionHasErrors([
            'car_id' => "Mobil ini masih memiliki proses berkas aktif ({$activeProcess->process_number}). Selesaikan atau batalkan proses tersebut terlebih dahulu.",
        ]);

    expect(DocumentProcess::query()->count())->toBe(1);
});

test('same car can start a new document process after the previous process is cancelled', function () {
    $user = User::factory()->create();
    $car = createCarWithCapital();

    $this->actingAs($user)
        ->post(route('document-processes.store'), validDocumentProcessPayload($car));

    $process = DocumentProcess::query()->sole();

    $this->actingAs($user)
        ->patch(route('document-processes.cancel', $process), [
            'reason' => 'Pengurusan tidak dilanjutkan.',
        ])
        ->assertSessionHasNoErrors();

    $this->actingAs($user)
        ->post(route('document-processes.store'), [
            ...validDocumentProcessPayload($car),
            'process_type' => 'other',
        ])
        ->assertSessionHasNoErrors();

    expect(DocumentProcess::query()->count())->toBe(2)
        ->and(DocumentProcess::query()->where('status', 'cancelled')->count())
        ->toBe(1)
        ->and(DocumentProcess::query()->where('status', 'waiting_documents')->count())
        ->toBe(1);
});

test('only costs paid by the showroom increase vehicle capital', function () {
    $user = User::factory()->create();
    $car = createCarWithCapital();

    $this->actingAs($user)
        ->post(route('document-processes.store'), validDocumentProcessPayload($car));

    $process = DocumentProcess::query()->sole();

    $this->actingAs($user)
        ->post(route('document-processes.costs.store', $process), [
            'description' => 'Pokok pajak dibayar customer',
            'amount' => 2_000_000,
            'paid_by' => 'customer',
            'paid_at' => now()->toDateString(),
        ])
        ->assertSessionHasNoErrors();

    expect($car->capital?->fresh()->document_process_cost)->toBe(0);

    $this->actingAs($user)
        ->post(route('document-processes.costs.store', $process), [
            'description' => 'Jasa pengurusan showroom',
            'amount' => 750_000,
            'paid_by' => 'showroom',
            'paid_at' => now()->toDateString(),
        ])
        ->assertSessionHasNoErrors();

    expect($car->capital?->fresh()->document_process_cost)->toBe(750_000)
        ->and($process->fresh()->total_cost)->toBe(2_850_000)
        ->and($process->fresh()->capitalized_cost)->toBe(750_000);
});

test('completed annual tax process updates stnk data and records document custody', function () {
    $user = User::factory()->create();
    $car = createCarWithCapital();

    $this->actingAs($user)
        ->post(route('document-processes.store'), validDocumentProcessPayload($car));

    $process = DocumentProcess::query()->with('items')->sole();
    $stnkItem = $process->items->firstWhere('item_key', 'stnk');
    $occurredAt = now()->subHour()->format('Y-m-d\TH:i');

    $this->actingAs($user)
        ->post(route('document-processes.events.store', $process), [
            'status' => 'completed',
            'occurred_at' => $occurredAt,
            'description' => 'Pajak tahunan selesai dibayar.',
            'received_items' => [$stnkItem?->id],
            'result' => [
                'annual_tax_due_at' => now()->addYear()->toDateString(),
            ],
        ])
        ->assertSessionHasNoErrors();

    expect($process->fresh()->status)->toBe('completed')
        ->and($stnkItem?->fresh()->custody_status)->toBe('received');

    $this->assertDatabaseHas('vehicle_documents', [
        'car_id' => $car->id,
        'document_type' => 'stnk',
        'annual_tax_due_at' => now()->addYear()->toDateString(),
        'status' => 'complete',
    ]);
});

test('received documents must belong to the selected document process', function () {
    $user = User::factory()->create();
    $firstCar = createCarWithCapital();
    $secondCar = createCarWithCapital();

    $this->actingAs($user)
        ->post(
            route('document-processes.store'),
            validDocumentProcessPayload($firstCar),
        );
    $this->actingAs($user)
        ->post(
            route('document-processes.store'),
            validDocumentProcessPayload($secondCar),
        );

    [$firstProcess, $secondProcess] = DocumentProcess::query()
        ->with('items')
        ->orderBy('id')
        ->get();
    $foreignItem = $secondProcess->items->first();

    $this->actingAs($user)
        ->post(route('document-processes.events.store', $firstProcess), [
            'status' => 'processing',
            'occurred_at' => now()->subHour()->format('Y-m-d\TH:i'),
            'description' => 'Dokumen sudah diterima.',
            'received_items' => [$foreignItem?->id],
        ])
        ->assertSessionHasErrors('received_items');

    expect($firstProcess->events()->count())->toBe(1)
        ->and($firstProcess->fresh()->status)->toBe('waiting_documents');
});

test('cancelling a process removes its showroom costs from vehicle capital', function () {
    $user = User::factory()->create();
    $car = createCarWithCapital();
    $payload = [
        ...validDocumentProcessPayload($car),
        'initial_cost' => 900_000,
        'initial_cost_paid_by' => 'showroom',
    ];

    $this->actingAs($user)
        ->post(route('document-processes.store'), $payload);

    $process = DocumentProcess::query()->sole();

    expect($car->capital?->fresh()->document_process_cost)->toBe(900_000);

    $this->actingAs($user)
        ->patch(route('document-processes.cancel', $process), [
            'reason' => 'Customer membatalkan pengurusan berkas.',
        ])
        ->assertSessionHasNoErrors();

    expect($process->fresh()->status)->toBe('cancelled')
        ->and($process->events()->count())->toBe(2)
        ->and($process->costs()->count())->toBe(1)
        ->and($process->events()->latest('id')->first()?->notes)
        ->toBe('Customer membatalkan pengurusan berkas.')
        ->and($car->capital?->fresh()->document_process_cost)->toBe(0);
});

test('cancelling returns documents currently held without deleting history', function () {
    $user = User::factory()->create();
    $car = createCarWithCapital();

    $this->actingAs($user)
        ->post(route('document-processes.store'), validDocumentProcessPayload($car));

    $process = DocumentProcess::query()->with('items')->sole();
    $stnkItem = $process->items->firstWhere('item_key', 'stnk');

    $this->actingAs($user)
        ->post(route('document-processes.events.store', $process), [
            'status' => 'processing',
            'occurred_at' => now()->subMinute()->format('Y-m-d\TH:i'),
            'description' => 'STNK sudah diterima showroom.',
            'received_items' => [$stnkItem?->id],
        ])
        ->assertSessionHasNoErrors();

    $this->actingAs($user)
        ->patch(route('document-processes.cancel', $process), [
            'reason' => 'Pengurusan dibatalkan dan dokumen dikembalikan.',
        ])
        ->assertSessionHasNoErrors();

    expect($process->fresh()->status)->toBe('cancelled')
        ->and($process->events()->count())->toBe(3)
        ->and($process->costs()->count())->toBe(1)
        ->and($stnkItem?->fresh()->custody_status)->toBe('returned')
        ->and($stnkItem?->fresh()->returned_at)->not->toBeNull();
});

test('permanent deletion removes a new process records files and vehicle capital cost', function () {
    Storage::fake('local');

    $user = User::factory()->create();
    $car = createCarWithCapital();
    $payload = [
        ...validDocumentProcessPayload($car),
        'initial_cost' => 900_000,
        'initial_cost_paid_by' => 'showroom',
    ];

    $this->actingAs($user)
        ->post(route('document-processes.store'), $payload);

    $process = DocumentProcess::query()->sole();

    $this->actingAs($user)
        ->post(route('document-processes.costs.store', $process), [
            'description' => 'Biaya administrasi',
            'amount' => 500_000,
            'paid_by' => 'showroom',
            'paid_at' => now()->toDateString(),
            'receipt' => UploadedFile::fake()->create(
                'bukti-administrasi.pdf',
                100,
                'application/pdf',
            ),
        ])
        ->assertSessionHasNoErrors();

    $file = $process->files()->sole();
    $processNumber = $process->process_number;
    $processId = $process->id;

    expect($car->capital?->fresh()->document_process_cost)->toBe(1_400_000);
    Storage::disk('local')->assertExists($file->file_path);

    $this->actingAs($user)
        ->delete(route('document-processes.destroy', $process), [
            'reason' => 'Data proses dibuat dua kali.',
            'process_number' => $processNumber,
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('document-processes.index'));

    $this->assertDatabaseMissing('document_processes', ['id' => $processId]);
    $this->assertDatabaseMissing('document_process_items', [
        'document_process_id' => $processId,
    ]);
    $this->assertDatabaseMissing('document_process_events', [
        'document_process_id' => $processId,
    ]);
    $this->assertDatabaseMissing('document_process_costs', [
        'document_process_id' => $processId,
    ]);
    $this->assertDatabaseMissing('document_process_files', [
        'document_process_id' => $processId,
    ]);
    $this->assertDatabaseHas('document_process_deletion_audits', [
        'process_number' => $processNumber,
        'reason' => 'Data proses dibuat dua kali.',
        'deleted_by' => $user->id,
    ]);

    $audit = DocumentProcessDeletionAudit::query()->sole();

    expect($audit->snapshot['event_count'])->toBe(1)
        ->and($audit->snapshot['cost_count'])->toBe(2)
        ->and($audit->snapshot['file_count'])->toBe(1)
        ->and($car->capital?->fresh()->document_process_cost)->toBe(0);
    Storage::disk('local')->assertMissing($file->file_path);
});

test('process with tracking progress cannot be deleted permanently', function () {
    $user = User::factory()->create();
    $car = createCarWithCapital();

    $this->actingAs($user)
        ->post(route('document-processes.store'), validDocumentProcessPayload($car));

    $process = DocumentProcess::query()->sole();

    $this->actingAs($user)
        ->post(route('document-processes.events.store', $process), [
            'status' => 'processing',
            'occurred_at' => now()->subMinute()->format('Y-m-d\TH:i'),
            'description' => 'Dokumen sedang diproses.',
        ])
        ->assertSessionHasNoErrors();

    $this->actingAs($user)
        ->delete(route('document-processes.destroy', $process), [
            'reason' => 'Mencoba menghapus proses berjalan.',
            'process_number' => $process->process_number,
        ])
        ->assertSessionHasErrors('process_number');

    expect($process->fresh())->not->toBeNull()
        ->and(DocumentProcessDeletionAudit::query()->count())->toBe(0);
});

test('completed process cannot be cancelled', function () {
    $user = User::factory()->create();
    $car = createCarWithCapital();

    $this->actingAs($user)
        ->post(route('document-processes.store'), validDocumentProcessPayload($car));

    $process = DocumentProcess::query()->sole();
    $process->update(['status' => 'completed', 'completed_at' => now()]);

    $this->actingAs($user)
        ->patch(route('document-processes.cancel', $process), [
            'reason' => 'Mencoba membatalkan proses selesai.',
        ])
        ->assertSessionHasErrors('reason');

    expect($process->fresh()->status)->toBe('completed')
        ->and($process->events()->count())->toBe(1);
});

test('receipt is stored privately and can be downloaded by an authenticated user', function () {
    Storage::fake('local');

    $user = User::factory()->create();
    $car = createCarWithCapital();

    $this->actingAs($user)
        ->post(route('document-processes.store'), validDocumentProcessPayload($car));

    $process = DocumentProcess::query()->sole();

    $this->actingAs($user)
        ->post(route('document-processes.costs.store', $process), [
            'description' => 'Pokok pajak',
            'amount' => 1_000_000,
            'paid_by' => 'showroom',
            'paid_at' => now()->toDateString(),
            'receipt' => UploadedFile::fake()->create(
                'bukti-pajak.pdf',
                100,
                'application/pdf',
            ),
        ])
        ->assertSessionHasNoErrors();

    $file = $process->files()->sole();

    Storage::disk('local')->assertExists($file->file_path);

    $this->actingAs($user)
        ->get(route('document-process-files.download', $file))
        ->assertOk()
        ->assertDownload($file->file_name);
});

test('store process validation rejects future started_at with friendly indonesian message', function () {
    $user = User::factory()->create();
    $car = createCarWithCapital();
    $payload = [
        ...validDocumentProcessPayload($car),
        'started_at' => now()->addDays(3)->toDateString(),
    ];

    $this->actingAs($user)
        ->post(route('document-processes.store'), $payload)
        ->assertSessionHasErrors([
            'started_at' => 'Tanggal mulai tidak boleh melebihi tanggal hari ini.',
        ]);
});

test('name transfer document process creates checklist with license plate and without receipt requirement', function () {
    $user = User::factory()->create();
    $car = createCarWithCapital();
    $payload = [
        ...validDocumentProcessPayload($car),
        'process_type' => 'name_transfer',
        'target_owner_name' => 'Ahmad Dahlan',
    ];

    $this->actingAs($user)
        ->post(route('document-processes.store'), $payload)
        ->assertRedirect();

    $process = DocumentProcess::query()->where('process_type', 'name_transfer')->firstOrFail();
    $itemKeys = $process->items()->pluck('item_key')->all();

    expect($itemKeys)
        ->toContain('stnk', 'bpkb', 'invoice', 'license_plate', 'new_owner_id')
        ->not->toContain('receipt');
});

test('five year tax process creates checklist with license plate requirement', function () {
    $user = User::factory()->create();
    $car = createCarWithCapital();
    $payload = [
        ...validDocumentProcessPayload($car),
        'process_type' => 'five_year_tax',
    ];

    $this->actingAs($user)
        ->post(route('document-processes.store'), $payload)
        ->assertRedirect();

    $process = DocumentProcess::query()->where('process_type', 'five_year_tax')->firstOrFail();
    $itemKeys = $process->items()->pluck('item_key')->all();

    expect($itemKeys)
        ->toContain('stnk', 'bpkb', 'license_plate', 'owner_id', 'physical_check');
});

test('completing a process event automatically marks all unreceived items as received', function () {
    $user = User::factory()->create();
    $car = createCarWithCapital();

    $this->actingAs($user)
        ->post(route('document-processes.store'), [
            ...validDocumentProcessPayload($car),
            'process_type' => 'five_year_tax',
        ]);

    $process = DocumentProcess::query()->where('process_type', 'five_year_tax')->firstOrFail();

    $this->actingAs($user)
        ->post(route('document-processes.events.store', $process), [
            'status' => 'completed',
            'occurred_at' => now()->toDateTimeString(),
            'description' => 'Semua dokumen dan plat nomor baru telah selesai dan diterima.',
            'result' => [
                'stnk_expires_at' => now()->addYears(5)->toDateString(),
            ],
        ])
        ->assertRedirect();

    $process->refresh();
    expect($process->status)->toBe('completed')
        ->and($process->items()->where('custody_status', 'received')->count())->toBe(5);
});

test('event result rejects invalid license plate format', function () {
    $user = User::factory()->create();
    $car = createCarWithCapital();

    $this->actingAs($user)
        ->post(route('document-processes.store'), [
            ...validDocumentProcessPayload($car),
            'process_type' => 'name_transfer',
            'target_owner_name' => 'Ahmad Dahlan',
        ]);

    $process = DocumentProcess::query()->where('process_type', 'name_transfer')->firstOrFail();

    $this->actingAs($user)
        ->post(route('document-processes.events.store', $process), [
            'status' => 'completed',
            'occurred_at' => now()->toDateTimeString(),
            'description' => 'Selesai balik nama.',
            'result' => [
                'license_plate' => 'dd',
            ],
        ])
        ->assertSessionHasErrors([
            'result.license_plate' => 'Format plat nomor tidak valid (contoh: KT 1234 TB atau B 1234 ABC).',
        ]);
});

test('event result accepts 3 part license plate inputs and updates car plate', function () {
    $user = User::factory()->create();
    $car = createCarWithCapital();

    $this->actingAs($user)
        ->post(route('document-processes.store'), [
            ...validDocumentProcessPayload($car),
            'process_type' => 'name_transfer',
            'target_owner_name' => 'Ahmad Dahlan',
        ]);

    $process = DocumentProcess::query()->where('process_type', 'name_transfer')->firstOrFail();

    $this->actingAs($user)
        ->post(route('document-processes.events.store', $process), [
            'status' => 'completed',
            'occurred_at' => now()->toDateTimeString(),
            'description' => 'Selesai balik nama dan plat baru jadi.',
            'result' => [
                'plate_prefix' => 'kt',
                'plate_number' => '5678',
                'plate_suffix' => 'tb',
                'owner_name' => 'Ahmad Dahlan',
            ],
        ])
        ->assertRedirect();

    $car->refresh();
    expect($car->license_plate)->toBe('KT 5678 TB');
});

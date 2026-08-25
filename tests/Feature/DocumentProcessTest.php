<?php

use App\Models\Car;
use App\Models\DocumentProcess;
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
            'status' => 'documents_ready',
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
        ->post(route('document-processes.events.store', $process), [
            'status' => 'cancelled',
            'occurred_at' => now()->subHour()->format('Y-m-d\TH:i'),
            'description' => 'Proses dibatalkan oleh showroom.',
        ])
        ->assertSessionHasNoErrors();

    expect($process->fresh()->status)->toBe('cancelled')
        ->and($car->capital?->fresh()->document_process_cost)->toBe(0);
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
        ->assertDownload('bukti-pajak.pdf');
});

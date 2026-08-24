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
        'processor_name' => 'Biro Jasa Makassar',
        'processor_phone' => '081234567890',
        'notes' => 'Pengurusan pajak tahunan.',
    ];
}

test('guest cannot access document process management', function () {
    $this->get(route('document-processes.index'))
        ->assertRedirect(route('login'));
});

test('user creates a process with requirements timeline and capitalized initial cost', function () {
    $user = User::factory()->create();
    $car = createCarWithCapital();
    $payload = [
        ...validDocumentProcessPayload($car),
        'initial_cost' => 1_500_000,
        'initial_cost_type' => 'administration',
        'initial_cost_paid_by' => 'showroom',
    ];

    $this->actingAs($user)
        ->post(route('document-processes.store'), $payload)
        ->assertSessionHasNoErrors();

    $process = DocumentProcess::query()->sole();

    expect($process->process_number)->toStartWith('BRK-')
        ->and($process->items()->count())->toBe(2)
        ->and($process->events()->count())->toBe(1)
        ->and((int) $process->costs()->sum('amount'))->toBe(1_500_000)
        ->and($car->capital?->fresh()->document_process_cost)->toBe(1_500_000)
        ->and($car->capital?->fresh()->total_capital)->toBe(105_000_000);

    $this->assertDatabaseHas('document_process_items', [
        'document_process_id' => $process->id,
        'item_key' => 'stnk',
        'custody_status' => 'waiting',
    ]);
});

test('index can open the process form for a vehicle selected from its detail page', function () {
    $user = User::factory()->create();
    $car = createCarWithCapital();

    $this->actingAs($user)
        ->get(route('document-processes.index', ['car_id' => $car->id]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('document-processes/index')
            ->where('selected_car_id', $car->id)
            ->where('cars.0.id', $car->id)
            ->has('type_options.annual_tax')
            ->has('cost_type_options.tax')
        );
});

test('only costs paid by the showroom increase vehicle capital', function () {
    $user = User::factory()->create();
    $car = createCarWithCapital();

    $this->actingAs($user)
        ->post(route('document-processes.store'), validDocumentProcessPayload($car));

    $process = DocumentProcess::query()->sole();

    $this->actingAs($user)
        ->post(route('document-processes.costs.store', $process), [
            'cost_type' => 'tax',
            'description' => 'Pokok pajak dibayar customer',
            'amount' => 2_000_000,
            'paid_by' => 'customer',
            'paid_at' => now()->toDateString(),
        ])
        ->assertSessionHasNoErrors();

    expect($car->capital?->fresh()->document_process_cost)->toBe(0);

    $this->actingAs($user)
        ->post(route('document-processes.costs.store', $process), [
            'cost_type' => 'agent_fee',
            'description' => 'Jasa pengurusan showroom',
            'amount' => 750_000,
            'paid_by' => 'showroom',
            'paid_at' => now()->toDateString(),
        ])
        ->assertSessionHasNoErrors();

    expect($car->capital?->fresh()->document_process_cost)->toBe(750_000)
        ->and($process->fresh()->total_cost)->toBe(2_750_000)
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

test('cancelling a process removes its showroom costs from vehicle capital', function () {
    $user = User::factory()->create();
    $car = createCarWithCapital();
    $payload = [
        ...validDocumentProcessPayload($car),
        'initial_cost' => 900_000,
        'initial_cost_type' => 'agent_fee',
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
            'cost_type' => 'tax',
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

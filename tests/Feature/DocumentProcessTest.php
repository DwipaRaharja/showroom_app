<?php

use App\Models\Car;
use App\Models\Customer;
use App\Models\DocumentProcess;
use App\Models\Payment;
use App\Models\Sale;
use App\Models\User;

function createDocumentProcessSale(): Sale
{
    $car = Car::factory()->create(['status' => 'available']);

    return Sale::query()->create([
        'car_id' => $car->id,
        'customer_id' => Customer::factory()->create()->id,
        'payment_type' => 'cash_tempo',
        'deal_price' => 200_000_000,
        'down_payment' => 0,
        'finance_amount' => 0,
        'leasing_bonus' => 0,
        'status' => 'pending',
    ]);
}

function startDocumentProcess(User $user, Sale $sale): DocumentProcess
{
    test()->actingAs($user)
        ->post(route('document-processes.store', $sale), [
            'process_type' => 'name_transfer',
            'assigned_to' => $user->id,
            'started_at' => '2026-08-22',
            'estimated_completion_date' => '2026-09-05',
            'notes' => 'Proses QA',
        ])
        ->assertSessionHasNoErrors();

    return DocumentProcess::query()->whereBelongsTo($sale)->sole();
}

function completeRequiredVehicleDocuments(Sale $sale): void
{
    foreach (DocumentProcess::REQUIRED_DOCUMENT_TYPES as $type) {
        $sale->car->documents()->create([
            'document_type' => $type,
            'document_number' => strtoupper($type).'-QA-001',
            'owner_name' => 'Pemilik QA',
            'status' => 'complete',
            'original_received' => true,
        ]);
    }
}

test('starting a document process creates one checklist per required document', function () {
    $user = User::factory()->create();
    $sale = createDocumentProcessSale();
    $process = startDocumentProcess($user, $sale);

    expect($process->status)->toBe('waiting_documents')
        ->and($process->items()->count())->toBe(4)
        ->and($process->items()->where('required', true)->count())->toBe(4)
        ->and($process->activities()->where('type', 'created')->exists())->toBeTrue();

    $this->actingAs($user)
        ->post(route('document-processes.store', $sale), [
            'process_type' => 'handover',
            'started_at' => '2026-08-22',
        ])
        ->assertSessionHasErrors('process_type');

    expect(DocumentProcess::query()->whereBelongsTo($sale)->count())->toBe(1);
});

test('completing the vehicle document inventory makes a waiting process ready', function () {
    $user = User::factory()->create();
    $sale = createDocumentProcessSale();
    $process = startDocumentProcess($user, $sale);

    completeRequiredVehicleDocuments($sale);

    $process->refresh();

    expect($process->status)->toBe('ready')
        ->and($process->items()->where('status', 'ready')->count())->toBe(4);
});

test('document handover is rejected while the sale is not fully settled', function () {
    $user = User::factory()->create();
    $sale = createDocumentProcessSale();
    completeRequiredVehicleDocuments($sale);
    $process = startDocumentProcess($user, $sale);
    $item = $process->items()->firstOrFail();

    $this->actingAs($user)
        ->put(route('document-process-items.update', $item), [
            'status' => 'handed_over',
            'recipient_type' => 'customer',
            'recipient_name' => $sale->customer->name,
            'handed_over_at' => '2026-08-22 10:00:00',
        ])
        ->assertSessionHasErrors('status');

    expect($item->fresh()->status)->toBe('ready');
});

test('a settled sale can complete and hand over every required document', function () {
    $user = User::factory()->create();
    $sale = createDocumentProcessSale();
    completeRequiredVehicleDocuments($sale);
    $process = startDocumentProcess($user, $sale);

    Payment::query()->create([
        'sale_id' => $sale->id,
        'payment_date' => '2026-08-22',
        'payer_type' => 'customer',
        'payment_category' => 'settlement',
        'amount' => 200_000_000,
        'payment_method' => 'transfer',
        'destination_account' => 'BCA Showroom',
        'status' => 'confirmed',
    ]);

    foreach ($process->items as $item) {
        $this->actingAs($user)
            ->put(route('document-process-items.update', $item), [
                'status' => 'handed_over',
                'recipient_type' => 'customer',
                'recipient_name' => $sale->customer->name,
                'handed_over_at' => '2026-08-22 10:00:00',
            ])
            ->assertSessionHasNoErrors();
    }

    $process->refresh();

    expect($sale->fresh()->status)->toBe('completed')
        ->and($process->status)->toBe('handed_over')
        ->and($process->handed_over_at)->not->toBeNull()
        ->and($process->progress_percentage)->toBe(100);
});

test('a cancelled document process keeps its checklist and can be reopened', function () {
    $user = User::factory()->create();
    $sale = createDocumentProcessSale();
    $process = startDocumentProcess($user, $sale);

    $this->actingAs($user)
        ->patch(route('document-processes.cancel', $process))
        ->assertSessionHasNoErrors();

    expect($process->fresh()->status)->toBe('cancelled')
        ->and($process->items()->count())->toBe(4);

    $this->actingAs($user)
        ->patch(route('document-processes.reopen', $process))
        ->assertSessionHasNoErrors();

    expect($process->fresh()->status)->toBe('waiting_documents')
        ->and($process->activities()->where('type', 'reopened')->exists())->toBeTrue();
});

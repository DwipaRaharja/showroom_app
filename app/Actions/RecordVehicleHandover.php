<?php

declare(strict_types=1);

namespace App\Actions;

use App\Concerns\HandlesFileUploads;
use App\Models\Payment;
use App\Models\Sale;
use App\Models\VehicleHandover;
use App\Models\VehicleHandoverEvent;
use App\Models\VehicleHandoverItem;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Throwable;

class RecordVehicleHandover
{
    use HandlesFileUploads;

    /**
     * @param  array<string, mixed>  $validated
     * @param  array<int, UploadedFile>  $photos
     *
     * @throws ValidationException|Throwable
     */
    public function execute(Sale $sale, array $validated, array $photos, ?int $userId = null): VehicleHandoverEvent
    {
        $storedPaths = [];

        try {
            return DB::transaction(function () use ($sale, $validated, $photos, $userId, &$storedPaths) {
                // Ensure the sale has its relations loaded for business checks
                if (! $sale->relationLoaded('payments') || ! $sale->relationLoaded('handover')) {
                    $sale->loadMissing(['payments', 'handover.events.items']);
                }

                if ($sale->status === 'cancelled') {
                    throw ValidationException::withMessages([
                        'sale_id' => 'Penjualan yang dibatalkan tidak dapat memiliki tracking penyerahan.',
                    ]);
                }

                /** @var VehicleHandover $handover */
                $handover = VehicleHandover::query()->firstOrCreate(
                    ['sale_id' => $sale->id],
                    [
                        'car_id' => $sale->car_id,
                        'status' => 'pending',
                    ],
                );

                $this->guardCurrentBusinessState($sale, $handover, $validated);

                /** @var VehicleHandoverEvent $event */
                $event = $handover->events()->create([
                    'event_type' => $this->determineEventType($validated['items']),
                    'occurred_at' => $validated['occurred_at'],
                    'recipient_name' => $validated['recipient_name'],
                    'recipient_phone' => $validated['recipient_phone'] ?? null,
                    'recipient_id_card' => $validated['recipient_id_card'] ?? null,
                    'recipient_relation' => $validated['recipient_relation'],
                    'officer_name' => $validated['officer_name'],
                    'handover_location' => $validated['handover_location'],
                    'handover_address' => $validated['handover_address'] ?? null,
                    'vehicle_condition' => in_array('vehicle', $validated['items'], true)
                        ? ($validated['vehicle_condition'] ?? null)
                        : null,
                    'notes' => $validated['notes'] ?? null,
                    'created_by' => $userId,
                ]);

                foreach ($validated['items'] as $itemCode) {
                    $event->items()->create([
                        'item_code' => $itemCode,
                        'item_name' => $itemCode === 'other'
                            ? $validated['other_item_name']
                            : VehicleHandoverItem::LABELS[$itemCode],
                        'quantity' => $itemCode === 'keys'
                            ? (int) $validated['key_count']
                            : 1,
                    ]);
                }

                $this->confirmFinanceDisbursementFromBpkbHandover($sale, $event, $validated);

                $photoIndex = 1;
                $timestamp = time();
                foreach ($photos as $photo) {
                    $customName = "bast-foto-spk-{$sale->id}-{$event->event_type}-{$photoIndex}-{$timestamp}";

                    $attributes = $this->storeAndExtractFileAttributes(
                        $photo,
                        "vehicle-handovers/{$handover->id}/events/{$event->id}",
                        $customName,
                        errorKey: 'photos',
                        errorMessage: 'Salah satu foto bukti gagal disimpan. Silakan coba lagi.',
                    );

                    $storedPaths[] = $attributes['file_path'];
                    $event->photos()->create([
                        'vehicle_handover_id' => $handover->id,
                        'uploaded_by' => $userId,
                        ...$attributes,
                    ]);
                    $photoIndex++;
                }

                $handover->unsetRelation('events');
                $handover->refreshTrackingStatus();

                return $event;
            });
        } catch (Throwable $exception) {
            $this->deleteStoredFiles($storedPaths);
            throw $exception;
        }
    }

    /**
     * @param  array<string, mixed>  $validated
     */
    private function guardCurrentBusinessState(Sale $sale, VehicleHandover $handover, array $validated): void
    {
        /** @var array<int, string> $items */
        $items = $validated['items'];
        $duplicates = collect($items)
            ->reject(fn (string $item): bool => $item === 'other')
            ->filter(fn (string $item): bool => $handover->hasDeliveredItem($item))
            ->map(fn (string $item): string => VehicleHandoverItem::LABELS[$item])
            ->values();

        if ($duplicates->isNotEmpty()) {
            throw ValidationException::withMessages([
                'items' => 'Item berikut sudah pernah diserahkan: '.$duplicates->join(', ').'.',
            ]);
        }

        $containsBpkb = in_array('bpkb', $items, true);
        $containsOriginalDocument = $containsBpkb || in_array('invoice', $items, true);
        $isCreditBpkbHandover = $sale->payment_type === 'credit' && $containsBpkb;

        if ($isCreditBpkbHandover && $validated['recipient_relation'] !== 'leasing_officer') {
            throw ValidationException::withMessages([
                'recipient_relation' => 'BPKB penjualan kredit harus diserahkan kepada petugas leasing.',
            ]);
        }

        if ($isCreditBpkbHandover && $sale->customer_payment_shortfall > 0) {
            throw ValidationException::withMessages([
                'items' => 'Masih ada kekurangan pembayaran customer sebesar Rp '
                    .number_format($sale->customer_payment_shortfall, 0, ',', '.')
                    .'. Lunasi kekurangan sebelum menyerahkan BPKB ke leasing.',
            ]);
        }

        if ($containsOriginalDocument && ! $isCreditBpkbHandover && $sale->remaining_bill > 0) {
            throw ValidationException::withMessages([
                'items' => 'Transaksi belum lunas sehingga dokumen asli belum dapat diserahkan.',
            ]);
        }
    }

    /**
     * Treat the remaining agreed leasing principal as received only when the
     * BPKB is actually handed to the leasing officer.
     *
     * @param  array<string, mixed>  $validated
     */
    private function confirmFinanceDisbursementFromBpkbHandover(Sale $sale, VehicleHandoverEvent $event, array $validated): void
    {
        if ($sale->payment_type !== 'credit' || ! in_array('bpkb', $validated['items'], true)) {
            return;
        }

        $sale->unsetRelation('payments');
        $amount = min($sale->remaining_bill, $sale->remaining_finance_disbursement);

        if ($amount <= 0) {
            $sale->refreshSettlementStatus();

            return;
        }

        $paymentDate = Carbon::parse($validated['occurred_at'])->setTimezone('Asia/Makassar')->toDateString();

        Payment::query()->create([
            'sale_id' => $sale->id,
            'payment_date' => $paymentDate,
            'payer_type' => 'finance',
            'payment_category' => 'finance_disbursement',
            'amount' => $amount,
            'payment_method' => 'transfer',
            'destination_account' => 'Rekening showroom (penyerahan BPKB)',
            'reference_number' => 'BPKB-'.$event->id,
            'status' => 'confirmed',
            'notes' => 'Otomatis dikonfirmasi saat BPKB diserahkan kepada '.$validated['recipient_name'].'.',
        ]);

        $sale->update(['disbursement_actual_date' => $paymentDate]);
        $sale->refreshSettlementStatus();
    }

    /**
     * @param  array<int, string>  $items
     */
    private function determineEventType(array $items): string
    {
        if (in_array('vehicle', $items, true)) {
            return 'vehicle_delivery';
        }

        if (in_array('bpkb', $items, true) || in_array('invoice', $items, true)) {
            return 'document_delivery';
        }

        return 'item_delivery';
    }
}

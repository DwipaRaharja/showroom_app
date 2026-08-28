<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Concerns\HandlesFileUploads;
use App\Http\Requests\Handover\StoreHandoverRequest;
use App\Models\Payment;
use App\Models\Sale;
use App\Models\VehicleHandover;
use App\Models\VehicleHandoverEvent;
use App\Models\VehicleHandoverItem;
use App\Models\VehicleHandoverPhoto;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Throwable;

class VehicleHandoverController extends Controller
{
    use HandlesFileUploads;

    public function index(): Response
    {
        $sales = Sale::query()
            ->withHandoverDetails()
            ->where('status', '!=', 'cancelled')
            ->latest('id')
            ->get();

        $summary = [
            'total_sales' => $sales->count(),
            'ready_to_deliver' => $sales->filter(
                fn (Sale $sale): bool => $sale->can_deliver_vehicle
                    && ! $this->hasVehicleDelivery($sale),
            )->count(),
            'vehicle_delivered' => $sales->filter(
                fn (Sale $sale): bool => $this->hasVehicleDelivery($sale)
                    && ! $this->hasBpkbDelivery($sale),
            )->count(),
            'fully_completed' => $sales->filter(
                fn (Sale $sale): bool => $this->hasBpkbDelivery($sale),
            )->count(),
            'locked' => $sales->filter(
                fn (Sale $sale): bool => ! $sale->can_deliver_vehicle
                    && ! $this->hasVehicleDelivery($sale),
            )->count(),
        ];

        return Inertia::render('handovers/index', [
            'sales' => $sales,
            'summary' => $summary,
        ]);
    }

    /**
     * Display the form for recording a new handover tracking event.
     */
    public function create(Sale $sale): Response
    {
        return Inertia::render('handovers/create', [
            'sale' => $sale->loadHandoverDetails(),
        ]);
    }

    /**
     * Display the tracking detail page for a specific sale's handover.
     */
    public function show(Sale $sale): Response
    {
        return Inertia::render('handovers/show', [
            'sale' => $sale->loadHandoverDetails(),
        ]);
    }

    public function store(StoreHandoverRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        /** @var array<int, UploadedFile> $photos */
        $photos = $request->file('photos', []);
        $storedPaths = [];

        try {
            DB::transaction(function () use (
                $request,
                $validated,
                $photos,
                &$storedPaths,
            ): void {
                /** @var Sale $sale */
                $sale = Sale::query()
                    ->with(['payments', 'handover.events.items'])
                    ->lockForUpdate()
                    ->findOrFail($validated['sale_id']);

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
                    'created_by' => $request->user()?->id,
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

                $this->confirmFinanceDisbursementFromBpkbHandover(
                    $sale,
                    $event,
                    $validated,
                );

                foreach ($photos as $photo) {
                    $attributes = $this->storeAndExtractFileAttributes(
                        $photo,
                        "vehicle-handovers/{$handover->id}/events/{$event->id}",
                        errorKey: 'photos',
                        errorMessage: 'Salah satu foto bukti gagal disimpan. Silakan coba lagi.',
                    );

                    $storedPaths[] = $attributes['file_path'];
                    $event->photos()->create([
                        'vehicle_handover_id' => $handover->id,
                        'uploaded_by' => $request->user()?->id,
                        ...$attributes,
                    ]);
                }

                $handover->unsetRelation('events');
                $handover->refreshTrackingStatus();
            });
        } catch (Throwable $exception) {
            $this->deleteStoredFiles($storedPaths);

            throw $exception;
        }

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Tracking penyerahan berhasil ditambahkan.',
        ]);

        return to_route('handovers.show', $validated['sale_id']);
    }

    public function printBast(Sale $sale): Response
    {
        $sale->loadHandoverDetails();

        $handover = $sale->getRelation('handover');

        abort_unless(
            $handover instanceof VehicleHandover
                && $handover->hasDeliveredItem('vehicle'),
            404,
        );

        return Inertia::render('sales/bast-print', [
            'sale' => $sale,
            'handover' => $handover,
        ]);
    }

    public function downloadProof(VehicleHandover $handover): StreamedResponse
    {
        $handover->loadMissing('events.photos');
        $photo = $handover->events
            ->flatMap->photos
            ->sortBy('id')
            ->first();

        abort_unless($photo instanceof VehicleHandoverPhoto, 404);

        return $this->downloadStoredPhoto($photo);
    }

    public function downloadPhoto(VehicleHandoverPhoto $photo): StreamedResponse
    {
        return $this->downloadStoredPhoto($photo);
    }

    public function showPhoto(VehicleHandoverPhoto $photo): StreamedResponse
    {
        abort_unless(Storage::disk('local')->exists($photo->file_path), 404);

        return Storage::disk('local')->response(
            $photo->file_path,
            $photo->file_name,
            ['Content-Type' => $photo->file_mime ?? 'application/octet-stream'],
            'inline',
        );
    }

    /** @param array<string, mixed> $validated */
    private function guardCurrentBusinessState(
        Sale $sale,
        VehicleHandover $handover,
        array $validated,
    ): void {
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
        $containsOriginalDocument = $containsBpkb
            || in_array('invoice', $items, true);
        $isCreditBpkbHandover = $sale->payment_type === 'credit'
            && $containsBpkb;

        if (
            $isCreditBpkbHandover
            && $validated['recipient_relation'] !== 'leasing_officer'
        ) {
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

        if (
            $containsOriginalDocument
            && ! $isCreditBpkbHandover
            && $sale->remaining_bill > 0
        ) {
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
    private function confirmFinanceDisbursementFromBpkbHandover(
        Sale $sale,
        VehicleHandoverEvent $event,
        array $validated,
    ): void {
        if (
            $sale->payment_type !== 'credit'
            || ! in_array('bpkb', $validated['items'], true)
        ) {
            return;
        }

        $sale->unsetRelation('payments');
        $amount = min(
            $sale->remaining_bill,
            $sale->remaining_finance_disbursement,
        );

        if ($amount <= 0) {
            $sale->refreshSettlementStatus();

            return;
        }

        $paymentDate = Carbon::parse($validated['occurred_at'])
            ->setTimezone('Asia/Makassar')
            ->toDateString();

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
            'notes' => 'Otomatis dikonfirmasi saat BPKB diserahkan kepada '
                .$validated['recipient_name'].'.',
        ]);

        $sale->update([
            'disbursement_actual_date' => $paymentDate,
        ]);
        $sale->refreshSettlementStatus();
    }

    /** @param array<int, string> $items */
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

    private function downloadStoredPhoto(VehicleHandoverPhoto $photo): StreamedResponse
    {
        abort_unless(Storage::disk('local')->exists($photo->file_path), 404);

        return Storage::disk('local')->download(
            $photo->file_path,
            $photo->file_name,
        );
    }

    private function hasVehicleDelivery(Sale $sale): bool
    {
        $handover = $sale->getRelation('handover');

        return $handover instanceof VehicleHandover
            && $handover->hasDeliveredItem('vehicle');
    }

    private function hasBpkbDelivery(Sale $sale): bool
    {
        $handover = $sale->getRelation('handover');

        return $handover instanceof VehicleHandover
            && $handover->hasDeliveredItem('bpkb');
    }
}

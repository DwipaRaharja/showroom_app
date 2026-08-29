<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\RecordVehicleHandover;
use App\Concerns\HandlesFileUploads;
use App\Http\Requests\Handover\StoreHandoverRequest;
use App\Models\Sale;
use App\Models\VehicleHandover;
use App\Models\VehicleHandoverPhoto;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

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

    public function store(StoreHandoverRequest $request, RecordVehicleHandover $action): RedirectResponse
    {
        $validated = $request->validated();
        /** @var array<int, UploadedFile> $photos */
        $photos = $request->file('photos', []);

        /** @var Sale $sale */
        $sale = Sale::query()
            ->lockForUpdate()
            ->findOrFail($validated['sale_id']);

        $action->execute($sale, $validated, $photos, $request->user()?->id);

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

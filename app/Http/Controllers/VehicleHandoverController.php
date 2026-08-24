<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\Handover\StoreHandoverRequest;
use App\Models\Sale;
use App\Models\VehicleHandover;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Throwable;

class VehicleHandoverController extends Controller
{
    /**
     * Display a listing of sales and their vehicle handover / BAST statuses.
     */
    public function index(): Response
    {
        $sales = Sale::query()
            ->with([
                'car' => fn ($q) => $q->with('brand:id,name'),
                'customer',
                'financeCompany',
                'payments',
                'handover',
            ])
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
     * Store or update a vehicle handover (BAST) record.
     */
    public function store(StoreHandoverRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $uploadedFile = $request->file('proof_file');
        $newProofPath = null;

        if ($uploadedFile instanceof UploadedFile) {
            $newProofPath = $uploadedFile->store(
                "vehicle-handovers/{$validated['sale_id']}",
                'local',
            );

            if ($newProofPath === false) {
                throw ValidationException::withMessages([
                    'proof_file' => 'Bukti serah terima gagal disimpan. Silakan coba lagi.',
                ]);
            }
        }

        $oldProofPath = null;

        try {
            DB::transaction(function () use (
                $validated,
                $newProofPath,
                &$oldProofPath,
            ): void {
                /** @var Sale $sale */
                $sale = Sale::query()
                    ->with(['payments', 'handover'])
                    ->lockForUpdate()
                    ->findOrFail($validated['sale_id']);

                if ($sale->status === 'cancelled') {
                    throw ValidationException::withMessages([
                        'sale_id' => 'Penjualan yang dibatalkan tidak dapat diproses serah terimanya.',
                    ]);
                }

                $existing = $sale->handover;
                $vehicleDeliveredAt = $validated['vehicle_delivered_at']
                    ?? $existing?->vehicle_delivered_at;
                $bpkbDeliveredAt = $validated['bpkb_delivered_at']
                    ?? $existing?->bpkb_delivered_at;

                if ($vehicleDeliveredAt !== null && $sale->remaining_bill > 10_000_000) {
                    throw ValidationException::withMessages([
                        'vehicle_delivered_at' => 'Sisa tagihan berubah dan kembali melebihi batas Rp 10.000.000. Muat ulang halaman lalu periksa pembayaran.',
                    ]);
                }

                if ($bpkbDeliveredAt !== null && $sale->remaining_bill > 0) {
                    throw ValidationException::withMessages([
                        'bpkb_delivered_at' => 'Transaksi belum lunas sehingga BPKB tidak dapat diserahkan.',
                    ]);
                }

                $oldProofPath = $existing?->proof_file;

                VehicleHandover::query()->updateOrCreate(
                    ['sale_id' => $sale->id],
                    [
                        'car_id' => $sale->car_id,
                        'recipient_name' => $validated['recipient_name'],
                        'recipient_phone' => $validated['recipient_phone'] ?? null,
                        'recipient_id_card' => $validated['recipient_id_card'] ?? null,
                        'recipient_relation' => $validated['recipient_relation'],
                        'officer_name' => $validated['officer_name'],
                        'handover_location' => $validated['handover_location'],
                        'handover_address' => $validated['handover_address'] ?? null,
                        'vehicle_delivered_at' => $vehicleDeliveredAt,
                        'bpkb_delivered_at' => $bpkbDeliveredAt,
                        'bpkb_recipient_type' => $bpkbDeliveredAt !== null
                            ? ($validated['bpkb_recipient_type'] ?? $existing?->bpkb_recipient_type)
                            : null,
                        'checklist' => $validated['checklist'],
                        'notes' => $validated['notes'] ?? null,
                        'proof_file' => $newProofPath ?? $oldProofPath,
                    ],
                );
            });
        } catch (Throwable $exception) {
            if ($newProofPath !== null) {
                Storage::disk('local')->delete($newProofPath);
            }

            throw $exception;
        }

        if (
            $newProofPath !== null
            && $oldProofPath !== null
            && $oldProofPath !== $newProofPath
        ) {
            Storage::disk('local')->delete($oldProofPath);
        }

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Data penyerahan unit berhasil disimpan.',
        ]);

        return back();
    }

    /**
     * Show the printable BAST (Berita Acara Serah Terima) document.
     */
    public function printBast(Sale $sale): Response
    {
        $sale->load([
            'car.brand',
            'customer',
            'financeCompany',
            'payments' => fn ($query) => $query->orderBy('payment_date'),
            'handover',
        ]);

        $handover = $sale->getRelation('handover');

        abort_unless(
            $handover instanceof VehicleHandover
                && $handover->vehicle_delivered_at !== null,
            404,
        );

        return Inertia::render('sales/bast-print', [
            'sale' => $sale,
            'handover' => $handover,
        ]);
    }

    /**
     * Download the privately stored proof of handover.
     */
    public function downloadProof(VehicleHandover $handover): StreamedResponse
    {
        abort_if(
            $handover->proof_file === null
                || ! Storage::disk('local')->exists($handover->proof_file),
            404,
        );

        return Storage::disk('local')->download(
            $handover->proof_file,
            "bukti-{$handover->handover_number}.".pathinfo(
                $handover->proof_file,
                PATHINFO_EXTENSION,
            ),
        );
    }

    private function hasVehicleDelivery(Sale $sale): bool
    {
        $handover = $sale->getRelation('handover');

        return $handover instanceof VehicleHandover
            && $handover->vehicle_delivered_at !== null;
    }

    private function hasBpkbDelivery(Sale $sale): bool
    {
        $handover = $sale->getRelation('handover');

        return $handover instanceof VehicleHandover
            && $handover->bpkb_delivered_at !== null;
    }
}

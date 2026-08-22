<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\Handover\StoreHandoverRequest;
use App\Models\Sale;
use App\Models\VehicleHandover;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class VehicleHandoverController extends Controller
{
    /**
     * Store or update a vehicle handover (BAST) record.
     */
    public function store(StoreHandoverRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        /** @var Sale $sale */
        $sale = Sale::query()->with('car')->findOrFail($validated['sale_id']);

        $handover = VehicleHandover::query()->updateOrCreate(
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
                'vehicle_delivered_at' => $validated['vehicle_delivered_at'] ?? null,
                'bpkb_delivered_at' => $validated['bpkb_delivered_at'] ?? null,
                'bpkb_recipient_type' => $validated['bpkb_recipient_type'] ?? null,
                'checklist' => $validated['checklist'] ?? null,
                'notes' => $validated['notes'] ?? null,
            ]
        );

        return redirect()->back()->with('success', 'Data Penyerahan Kendaraan & BAST berhasil disimpan.');
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

        return Inertia::render('sales/bast-print', [
            'sale' => $sale,
            'handover' => $sale->handover,
        ]);
    }

    /**
     * Remove the handover record.
     */
    public function destroy(VehicleHandover $handover): RedirectResponse
    {
        $handover->delete();

        return redirect()->back()->with('success', 'Data penyerahan kendaraan berhasil dihapus.');
    }
}

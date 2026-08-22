<?php

namespace App\Http\Controllers;

use App\Http\Requests\Purchase\StorePurchaseRequest;
use App\Http\Requests\Purchase\UpdatePurchaseRequest;
use App\Models\Car;
use App\Models\Purchase;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class PurchaseController extends Controller
{
    /**
     * Display the purchase listing.
     */
    public function index(): Response
    {
        return Inertia::render('purchases/index', [
            'purchases' => Purchase::query()
                ->with([
                    'car:id,brand_id,name,license_plate,year',
                    'car.brand:id,name',
                ])
                ->latest('purchase_date')
                ->latest('id')
                ->get([
                    'id',
                    'purchase_number',
                    'car_id',
                    'purchase_date',
                    'price',
                    'repair_cost',
                    'transport_cost',
                    'other_cost',
                    'status',
                    'notes',
                    'created_at',
                ]),
        ]);
    }

    /**
     * Show the form for creating a new purchase.
     */
    public function create(): Response
    {
        return Inertia::render('purchases/create', [
            'cars' => Car::availableForPurchase()
                ->with('brand:id,name')
                ->orderBy('name')
                ->get(['id', 'brand_id', 'name', 'license_plate', 'year']),
        ]);
    }

    /**
     * Store a newly created purchase.
     */
    public function store(StorePurchaseRequest $request): RedirectResponse
    {
        Purchase::query()->create($request->validated());

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Data modal mobil berhasil ditambahkan.',
        ]);

        return to_route('purchases.index');
    }

    /**
     * Show the form for editing the specified purchase.
     */
    public function edit(Purchase $purchase): Response
    {
        return Inertia::render('purchases/edit', [
            'purchase' => $purchase->only([
                'id',
                'purchase_number',
                'car_id',
                'purchase_date',
                'price',
                'repair_cost',
                'transport_cost',
                'other_cost',
                'total_capital',
                'status',
                'notes',
                'created_at',
            ]),
            'cars' => Car::availableForPurchase($purchase->car_id)
                ->with('brand:id,name')
                ->orderBy('name')
                ->get(['id', 'brand_id', 'name', 'license_plate', 'year']),
        ]);
    }

    /**
     * Update the specified purchase.
     */
    public function update(UpdatePurchaseRequest $request, Purchase $purchase): RedirectResponse
    {
        $purchase->update($request->validated());

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Data modal mobil berhasil diperbarui.',
        ]);

        return to_route('purchases.index');
    }

    /**
     * Update the purchase status.
     */
    public function updateStatus(Request $request, Purchase $purchase): RedirectResponse
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in(['draft', 'completed', 'cancelled'])],
        ]);

        $purchase->update($validated);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Status modal diubah menjadi '.Purchase::STATUS_LABELS[$purchase->status].'.',
        ]);

        return to_route('purchases.index');
    }

    /**
     * Remove the specified purchase.
     */
    public function destroy(Purchase $purchase): RedirectResponse
    {
        $purchase->delete();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Data modal mobil berhasil dihapus.',
        ]);

        return to_route('purchases.index');
    }
}

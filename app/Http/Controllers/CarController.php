<?php

namespace App\Http\Controllers;

use App\Http\Requests\Car\StoreCarRequest;
use App\Http\Requests\Car\UpdateCarRequest;
use App\Models\Brand;
use App\Models\Car;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class CarController extends Controller
{
    /**
     * Display the car listing.
     */
    public function index(): Response
    {
        return Inertia::render('cars/index', [
            'cars' => Car::query()
                ->with([
                    'brand:id,name',
                    'capital:id,car_id,purchase_number,purchase_date,price,repair_cost,transport_cost,other_cost,status,notes,created_at',
                    'documents' => fn ($query) => $query->select([
                        'id',
                        'car_id',
                        'document_type',
                        'document_number',
                        'owner_name',
                        'issued_at',
                        'expires_at',
                        'status',
                        'original_received',
                        'notes',
                        'created_at',
                    ]),
                    'documentAttachment:id,car_id,file_name,file_mime,file_size,created_at,updated_at',
                ])
                ->latest('id')
                ->get([
                    'id',
                    'brand_id',
                    'name',
                    'license_plate',
                    'chassis_number',
                    'engine_number',
                    'year',
                    'color',
                    'transmission',
                    'fuel_type',
                    'mileage',
                    'selling_price',
                    'status',
                    'description',
                    'image',
                    'created_at',
                ]),
        ]);
    }

    /**
     * Show the form for creating a new car.
     */
    public function create(): Response
    {
        return Inertia::render('cars/create', [
            'brands' => Brand::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name']),
        ]);
    }

    /**
     * Display the specified car.
     */
    public function show(Car $car): Response
    {
        $car->load([
            'brand:id,name',
            'capital:id,car_id,purchase_number,purchase_date,price,repair_cost,transport_cost,other_cost,status,notes,created_at',
            'documents' => fn ($query) => $query->select([
                'id',
                'car_id',
                'document_type',
                'document_number',
                'owner_name',
                'issued_at',
                'expires_at',
                'status',
                'original_received',
                'notes',
                'created_at',
            ]),
            'documentAttachment:id,car_id,file_name,file_mime,file_size,created_at,updated_at',
        ]);

        return Inertia::render('cars/show', [
            'car' => $car,
        ]);
    }

    /**
     * Store a newly created car.
     */
    public function store(StoreCarRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $capital = $validated['capital'];
        unset($validated['capital']);

        DB::transaction(function () use ($validated, $capital): void {
            $car = Car::query()->create($validated);
            $car->capital()->create($capital);
        });

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Mobil dan modal awal berhasil ditambahkan.',
        ]);

        return to_route('cars.index');
    }

    /**
     * Show the form for editing the specified car.
     */
    public function edit(Car $car): Response
    {
        $car->load('capital');

        return Inertia::render('cars/edit', [
            'car' => [
                ...$car->only([
                    'id',
                    'brand_id',
                    'name',
                    'license_plate',
                    'chassis_number',
                    'engine_number',
                    'year',
                    'color',
                    'transmission',
                    'fuel_type',
                    'mileage',
                    'selling_price',
                    'status',
                    'description',
                    'image',
                    'created_at',
                ]),
                'capital' => $car->capital?->only([
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
            ],
            'brands' => Brand::query()
                ->where(function ($query) use ($car): void {
                    $query
                        ->where('is_active', true)
                        ->orWhere('id', $car->brand_id);
                })
                ->orderBy('name')
                ->get(['id', 'name']),
        ]);
    }

    /**
     * Update the specified car.
     */
    public function update(UpdateCarRequest $request, Car $car): RedirectResponse
    {
        $validated = $request->validated();
        $capital = $validated['capital'];
        unset($validated['capital']);

        if (
            $capital['status'] !== 'completed'
            && $car->sale()->exists()
        ) {
            throw ValidationException::withMessages([
                'capital.status' => 'Modal mobil yang sudah memiliki penjualan harus tetap aktif.',
            ]);
        }

        DB::transaction(function () use ($car, $validated, $capital): void {
            $car->update($validated);
            $car->capital()->updateOrCreate([], $capital);
        });

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Data mobil dan modal berhasil diperbarui.',
        ]);

        return to_route('cars.show', $car);
    }

    /**
     * Update the status of the specified car.
     */
    public function updateStatus(Request $request, Car $car): RedirectResponse
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in(['available', 'booked', 'sold', 'maintenance'])],
        ]);

        $car->update($validated);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Status mobil diubah menjadi '.Car::STATUS_LABELS[$car->status].'.',
        ]);

        return to_route('cars.show', $car);
    }

    /**
     * Remove the specified car.
     */
    public function destroy(Car $car): RedirectResponse
    {
        $car->delete();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Data mobil berhasil diarsipkan. Riwayat transaksi dan dokumen tetap tersimpan.',
        ]);

        return to_route('cars.index');
    }
}

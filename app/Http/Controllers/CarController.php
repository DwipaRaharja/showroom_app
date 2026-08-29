<?php

namespace App\Http\Controllers;

use App\Concerns\HandlesFileUploads;
use App\Http\Requests\Car\StoreCarRequest;
use App\Http\Requests\Car\UpdateCarRequest;
use App\Models\Brand;
use App\Models\Car;
use App\Models\Purchase;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Throwable;

class CarController extends Controller
{
    use HandlesFileUploads;

    /**
     * Display the car listing.
     */
    public function index(): Response
    {
        $cars = Car::query()
            ->withTrashed()
            ->withInventoryDetails()
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
                'updated_at',
                'deleted_at',
            ]);

        $nonArchivedCars = $cars->whereNull('deleted_at');
        $activeCars = $nonArchivedCars->whereIn('status', ['available', 'booked', 'maintenance']);
        $availableCars = $nonArchivedCars->where('status', 'available');

        $totalActiveCapital = (int) $activeCars->sum(function (Car $car): int {
            $capital = $car->getRelation('capital');

            return $capital instanceof Purchase
                ? (int) $capital->total_capital
                : 0;
        });

        $potentialSellingTurnover = (int) $availableCars->sum('selling_price');

        $summary = [
            'total_active' => $activeCars->count(),
            'available' => $availableCars->count(),
            'booked' => $nonArchivedCars->where('status', 'booked')->count(),
            'maintenance' => $nonArchivedCars->where('status', 'maintenance')->count(),
            'sold' => $nonArchivedCars->where('status', 'sold')->count(),
            'total_active_capital' => $totalActiveCapital,
            'potential_selling_turnover' => $potentialSellingTurnover,
        ];

        return Inertia::render('cars/index', [
            'cars' => $cars,
            'summary' => $summary,
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
        return Inertia::render('cars/show', [
            'car' => $car->loadInventoryDetails(),
        ]);
    }

    /**
     * Store a newly created car.
     */
    public function store(StoreCarRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $capital = $validated['capital'];
        $image = $request->file('image');
        unset($validated['capital'], $validated['image']);
        $storedImagePath = null;

        try {
            DB::transaction(function () use (
                $validated,
                $capital,
                $image,
                &$storedImagePath,
            ): void {
                $car = Car::query()->create($validated);

                if ($image instanceof UploadedFile) {
                    $car->loadMissing('brand');
                    $brandName = $car->brand->name;
                    $customName = "mobil-{$car->id}-{$brandName}-{$car->name}-{$car->license_plate}-".time();

                    $storedImagePath = $this->storeUploadedFile(
                        $image,
                        "cars/{$car->id}",
                        $customName,
                        errorKey: 'image',
                        errorMessage: 'Gambar kendaraan gagal disimpan. Silakan coba lagi.',
                    );
                    $car->update(['image' => $storedImagePath]);
                }

                $car->capital()->create($capital);
            });
        } catch (Throwable $exception) {
            $this->deleteStoredFiles($storedImagePath);

            throw $exception;
        }

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
                    'updated_at',
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
                    'document_process_cost',
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
        $image = $request->file('image');
        $removeImage = $request->boolean('remove_image');
        unset(
            $validated['capital'],
            $validated['image'],
            $validated['remove_image'],
        );

        if (
            $capital['status'] !== 'completed'
            && $car->sale()->exists()
        ) {
            throw ValidationException::withMessages([
                'capital.status' => 'Modal mobil yang sudah memiliki penjualan harus tetap aktif.',
            ]);
        }

        if ($car->sale()->exists() || in_array($car->status, ['booked', 'sold'], true)) {
            $validated['status'] = $car->status;
        }

        $oldImagePath = $car->image;
        $storedImagePath = null;

        try {
            if ($image instanceof UploadedFile) {
                $brandId = $validated['brand_id'] ?? $car->brand_id;
                $brand = is_numeric($brandId) ? Brand::query()->whereKey((int) $brandId)->first() : null;
                $brandName = $brand instanceof Brand ? $brand->name : $car->brand->name;
                $carName = $validated['name'] ?? $car->name;
                $licensePlate = $validated['license_plate'] ?? $car->license_plate;
                $customName = "mobil-{$car->id}-{$brandName}-{$carName}-{$licensePlate}-".time();

                $storedImagePath = $this->storeUploadedFile(
                    $image,
                    "cars/{$car->id}",
                    $customName,
                    errorKey: 'image',
                    errorMessage: 'Gambar kendaraan gagal disimpan. Silakan coba lagi.',
                );
                $validated['image'] = $storedImagePath;
            } elseif ($removeImage) {
                $validated['image'] = null;
            }

            DB::transaction(function () use ($car, $validated, $capital): void {
                $car->update($validated);
                $car->capital()->updateOrCreate([], $capital);
            });
        } catch (Throwable $exception) {
            $this->deleteStoredFiles($storedImagePath);

            throw $exception;
        }

        if (
            $oldImagePath !== null
            && ($storedImagePath !== null || $removeImage)
            && $oldImagePath !== $storedImagePath
        ) {
            $this->deleteStoredFiles($oldImagePath);
        }

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Data mobil dan modal berhasil diperbarui.',
        ]);

        return to_route('cars.show', $car);
    }

    public function image(Car $car): StreamedResponse
    {
        abort_unless(
            $car->image !== null
                && Storage::disk('local')->exists($car->image),
            404,
        );

        $mimeType = Storage::disk('local')->mimeType($car->image);
        $car->loadMissing('brand');
        $brandName = $car->brand->name;
        $extension = pathinfo($car->image, PATHINFO_EXTENSION) ?: 'jpg';
        $downloadName = $this->sanitizeFileName("mobil-{$car->id}-{$brandName}-{$car->name}-{$car->license_plate}", $extension);

        return Storage::disk('local')->response(
            $car->image,
            $downloadName,
            [
                'Content-Type' => is_string($mimeType)
                    ? $mimeType
                    : 'application/octet-stream',
            ],
            'inline',
        );
    }

    /**
     * Update the status of the specified car.
     */
    public function updateStatus(Request $request, Car $car): RedirectResponse
    {
        if ($car->sale()->exists() || in_array($car->status, ['booked', 'sold'], true)) {
            throw ValidationException::withMessages([
                'status' => 'Status mobil yang terikat transaksi penjualan dikelola otomatis dan tidak dapat diubah secara manual.',
            ]);
        }

        $validated = $request->validate([
            'status' => ['required', Rule::in(['available', 'maintenance'])],
        ], [
            'status.in' => 'Perubahan status mobil secara manual hanya diizinkan untuk status Tersedia atau Perbaikan.',
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

    /**
     * Restore an archived car.
     */
    public function restore(int $car): RedirectResponse
    {
        $car = Car::query()
            ->withTrashed()
            ->findOrFail($car);

        $car->restore();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Data mobil berhasil dipulihkan ke daftar aktif.',
        ]);

        return to_route('cars.index');
    }
}

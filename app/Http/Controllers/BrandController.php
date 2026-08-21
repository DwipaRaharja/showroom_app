<?php

namespace App\Http\Controllers;

use App\Http\Requests\Brand\StoreBrandRequest;
use App\Http\Requests\Brand\UpdateBrandRequest;
use App\Models\Brand;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class BrandController extends Controller
{
    /**
     * Display the brand listing.
     */
    public function index(): Response
    {
        return Inertia::render('brands/index', [
            'brands' => Brand::query()
                ->latest('id')
                ->get([
                    'id',
                    'name',
                    'slug',
                    'is_active',
                    'created_at',
                ]),
        ]);
    }

    /**
     * Store a newly created brand.
     */
    public function store(StoreBrandRequest $request): RedirectResponse
    {
        Brand::query()->create($request->validated());

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Merek berhasil ditambahkan.',
        ]);

        return to_route('brands.index');
    }

    /**
     * Update the specified brand.
     */
    public function update(UpdateBrandRequest $request, Brand $brand): RedirectResponse
    {
        $brand->update($request->validated());

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Merek berhasil diperbarui.',
        ]);

        return to_route('brands.index');
    }

    /**
     * Toggle the active status of the specified brand.
     */
    public function updateStatus(Brand $brand): RedirectResponse
    {
        $brand->update([
            'is_active' => ! $brand->is_active,
        ]);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => $brand->is_active
                ? 'Merek berhasil diaktifkan.'
                : 'Merek berhasil dinonaktifkan.',
        ]);

        return to_route('brands.index');
    }

    /**
     * Remove the specified brand.
     */
    public function destroy(Brand $brand): RedirectResponse
    {
        $brand->delete();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Merek berhasil dihapus.',
        ]);

        return to_route('brands.index');
    }
}

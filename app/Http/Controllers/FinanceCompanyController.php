<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\FinanceCompany\StoreFinanceCompanyRequest;
use App\Http\Requests\FinanceCompany\UpdateFinanceCompanyRequest;
use App\Models\FinanceCompany;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class FinanceCompanyController extends Controller
{
    /**
     * Display a listing of the finance companies.
     */
    public function index(): Response
    {
        $companies = FinanceCompany::query()
            ->withCount([
                'sales as sales_count' => fn ($query) => $query
                    ->where('payment_type', 'credit'),
            ])
            ->latest('id')
            ->get();

        $totalSalesFinanced = (int) $companies->sum('sales_count');

        return Inertia::render('finance-companies/index', [
            'finance_companies' => $companies,
            'summary' => [
                'total' => $companies->count(),
                'active' => $companies->where('is_active', true)->count(),
                'inactive' => $companies->where('is_active', false)->count(),
                'total_sales_financed' => $totalSalesFinanced,
            ],
        ]);
    }

    /**
     * Store a newly created finance company.
     */
    public function store(StoreFinanceCompanyRequest $request): RedirectResponse
    {
        FinanceCompany::query()->create($request->validated());

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Perusahaan leasing berhasil ditambahkan.',
        ]);

        return to_route('finance-companies.index');
    }

    /**
     * Update the specified finance company.
     */
    public function update(
        UpdateFinanceCompanyRequest $request,
        FinanceCompany $financeCompany,
    ): RedirectResponse {
        $financeCompany->update($request->validated());

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Data perusahaan leasing berhasil diperbarui.',
        ]);

        return to_route('finance-companies.index');
    }

    /**
     * Toggle the active status of the specified finance company.
     */
    public function updateStatus(FinanceCompany $financeCompany): RedirectResponse
    {
        $financeCompany->update([
            'is_active' => ! $financeCompany->is_active,
        ]);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => $financeCompany->is_active
                ? 'Perusahaan leasing berhasil diaktifkan.'
                : 'Perusahaan leasing berhasil dinonaktifkan.',
        ]);

        return to_route('finance-companies.index');
    }

    /**
     * Remove the specified finance company from storage.
     */
    public function destroy(FinanceCompany $financeCompany): RedirectResponse
    {
        if ($financeCompany->sales()->exists()) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'Perusahaan leasing tidak dapat dihapus karena sudah memiliki riwayat transaksi penjualan.',
            ]);

            return back();
        }

        $financeCompany->delete();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Perusahaan leasing berhasil dihapus.',
        ]);

        return to_route('finance-companies.index');
    }
}

<?php

namespace App\Http\Controllers;

use App\Http\Requests\Sale\StoreSaleRequest;
use App\Models\Car;
use App\Models\Customer;
use App\Models\FinanceCompany;
use App\Models\Payment;
use App\Models\Sale;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class SaleController extends Controller
{
    /**
     * Display a listing of sales transactions.
     */
    public function index(): Response
    {
        $sales = Sale::query()
            ->with([
                'car:id,brand_id,name,license_plate,year,color,selling_price,status',
                'car.brand:id,name',
                'customer:id,name,phone,ktp_number',
                'financeCompany:id,name,code,pic_name,pic_phone',
                'payments',
            ])
            ->latest('id')
            ->get();

        $totalTurnover = (int) $sales->sum('deal_price');
        $totalCollected = (int) $sales->sum('total_paid');
        $totalReceivables = max(0, $totalTurnover - $totalCollected);
        $totalBonusCollected = (int) $sales->sum('total_bonus_paid');
        $pendingDisbursementsCount = $sales->where('payment_type', 'credit')->where('status', '!=', 'completed')->count();

        return Inertia::render('sales/index', [
            'sales' => $sales,
            'summary' => [
                'total_turnover' => $totalTurnover,
                'total_collected' => $totalCollected,
                'total_receivables' => $totalReceivables,
                'total_bonus_collected' => $totalBonusCollected,
                'pending_disbursements_count' => $pendingDisbursementsCount,
            ],
        ]);
    }

    /**
     * Show the form for creating a new sales transaction.
     */
    public function create(): Response
    {
        return Inertia::render('sales/create', [
            'available_cars' => Car::query()
                ->availableForSale()
                ->with([
                    'brand:id,name',
                    'capital:id,car_id,purchase_number,price,repair_cost,transport_cost,other_cost,status',
                ])
                ->orderBy('name')
                ->get(['id', 'brand_id', 'name', 'license_plate', 'year', 'color', 'selling_price', 'status']),
            'customers' => Customer::query()
                ->activeForDropdown()
                ->orderBy('name')
                ->get(['id', 'name', 'phone', 'ktp_number']),
            'finance_companies' => FinanceCompany::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name', 'code', 'pic_name', 'pic_phone']),
        ]);
    }

    /**
     * Store a newly created sales transaction.
     */
    public function store(StoreSaleRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $sale = DB::transaction(function () use ($validated) {
            $paymentType = $validated['payment_type'];
            $dealPrice = (int) $validated['deal_price'];
            $downPayment = (int) ($validated['down_payment'] ?? 0);
            $financeAmount = $paymentType === 'credit'
                ? (int) ($validated['finance_amount'] ?? ($dealPrice - $downPayment))
                : 0;

            $initialStatus = 'pending';
            if ($paymentType === 'cash_full') {
                $downPayment = $dealPrice;
            }

            /** @var Sale $sale */
            $sale = Sale::query()->create([
                'car_id' => $validated['car_id'],
                'customer_id' => $validated['customer_id'],
                'finance_company_id' => $paymentType === 'credit' ? ($validated['finance_company_id'] ?? null) : null,
                'payment_type' => $paymentType,
                'deal_price' => $dealPrice,
                'down_payment' => $downPayment,
                'finance_amount' => $financeAmount,
                'disbursement_estimated_date' => $paymentType === 'credit' ? ($validated['disbursement_estimated_date'] ?? null) : null,
                'leasing_bonus' => $paymentType === 'credit' ? (int) ($validated['leasing_bonus'] ?? 0) : 0,
                'due_date' => $paymentType === 'cash_tempo' ? ($validated['due_date'] ?? null) : null,
                'status' => $initialStatus,
                'notes' => $validated['notes'] ?? null,
            ]);

            // If initial payment is recorded
            $shouldRecordPayment = $paymentType === 'cash_full' || ! empty($validated['record_initial_payment']);

            if ($shouldRecordPayment && $downPayment > 0) {
                Payment::query()->create([
                    'sale_id' => $sale->id,
                    'payment_date' => $validated['payment_date'] ?? now()->format('Y-m-d'),
                    'payer_type' => 'customer',
                    'payment_category' => $paymentType === 'cash_full' ? 'settlement' : 'down_payment',
                    'amount' => $downPayment,
                    'payment_method' => $validated['payment_method'] ?? 'transfer',
                    'destination_account' => $validated['destination_account'] ?? 'BCA Showroom (0123-456-789)',
                    'reference_number' => $validated['reference_number'] ?? null,
                    'status' => 'confirmed',
                    'notes' => $paymentType === 'cash_full' ? 'Pembayaran lunas langsung saat transaksi.' : 'Pembayaran uang muka (DP) awal.',
                ]);
            }

            $sale->refreshSettlementStatus();

            return $sale;
        });

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Transaksi penjualan berhasil dibuat.',
        ]);

        return to_route('sales.show', $sale->id);
    }

    /**
     * Display the specified sales transaction.
     */
    public function show(Sale $sale): Response
    {
        $sale->load([
            'car' => fn ($q) => $q->with([
                'brand:id,name',
                'capital:id,car_id,purchase_number,purchase_date,price,repair_cost,transport_cost,other_cost,status,notes,created_at',
                'documents',
            ]),
            'customer',
            'financeCompany',
            'payments' => fn ($q) => $q->latest('payment_date')->latest('id'),
            'handover',
        ]);

        return Inertia::render('sales/show', [
            'sale' => $sale,
        ]);
    }

    /**
     * Remove the specified sales transaction.
     */
    public function destroy(Sale $sale): RedirectResponse
    {
        DB::transaction(function () use ($sale) {
            $car = $sale->car;
            $sale->handover?->delete();
            $sale->delete();

            if ($car && ! $car->trashed()) {
                $car->update(['status' => 'available']);
            }
        });

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Transaksi penjualan berhasil dibatalkan.',
        ]);

        return to_route('sales.index');
    }
}

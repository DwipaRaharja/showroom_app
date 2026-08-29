<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Car;
use App\Models\DocumentProcess;
use App\Models\Purchase;
use App\Models\Sale;
use App\Services\DashboardMetricsService;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /** @var array<int, string> */
    private const STOCK_STATUSES = ['available', 'booked', 'maintenance'];

    /** @var array<int, string> */
    private const MONTH_LABELS = [
        1 => 'Jan', 2 => 'Feb', 3 => 'Mar', 4 => 'Apr',
        5 => 'Mei', 6 => 'Jun', 7 => 'Jul', 8 => 'Agu',
        9 => 'Sep', 10 => 'Okt', 11 => 'Nov', 12 => 'Des',
    ];

    public function __invoke(Request $request, DashboardMetricsService $metrics): Response
    {
        $now = Carbon::now('Asia/Makassar');
        $today = $now->copy()->startOfDay();

        $period = (string) $request->input('period', 'this_month');
        if (! in_array($period, ['this_month', 'last_month', 'this_year'], true)) {
            $period = 'this_month';
        }

        $prevMonth = $today->copy()->subMonthNoOverflow();
        $prevMonthLabel = self::MONTH_LABELS[$prevMonth->month] ?? (string) $prevMonth->month;

        [$periodStart, $periodEnd, $periodLabel] = match ($period) {
            'last_month' => [
                $prevMonth->copy()->startOfMonth(),
                $prevMonth->copy()->endOfMonth(),
                "Bulan Lalu ({$prevMonthLabel} {$prevMonth->year})",
            ],
            'this_year' => [
                $today->copy()->startOfYear(),
                $today->copy()->endOfDay(),
                "Tahun Ini ({$now->year})",
            ],
            default => [
                $today->copy()->startOfMonth(),
                $today->copy()->endOfDay(),
                'Bulan Ini',
            ],
        };

        /** @var EloquentCollection<int, Car> $stockCars */
        $stockCars = Car::query()
            ->whereIn('status', self::STOCK_STATUSES)
            ->with([
                'brand:id,name',
                'capital:id,car_id,purchase_number,purchase_date,price,repair_cost,transport_cost,other_cost,document_process_cost,status',
                'documents:id,car_id,document_type,expires_at,annual_tax_due_at,status',
                'documentProcesses' => fn ($query) => $query
                    ->whereNotIn('status', DocumentProcess::CLOSED_STATUSES)
                    ->latest('id'),
            ])
            ->get([
                'id',
                'brand_id',
                'name',
                'license_plate',
                'selling_price',
                'status',
                'created_at',
            ]);

        /** @var EloquentCollection<int, Sale> $activeSales */
        $activeSales = Sale::query()
            ->where('status', '!=', 'cancelled')
            ->with([
                'car:id,brand_id,name,license_plate,status',
                'car.brand:id,name',
                'customer:id,name,phone',
                'financeCompany:id,name',
                'payments:id,sale_id,payment_date,payer_type,payment_category,amount,status',
                'handover.events.items',
            ])
            ->get();

        /** @var EloquentCollection<int, DocumentProcess> $openProcesses */
        $openProcesses = DocumentProcess::query()
            ->whereNotIn('status', DocumentProcess::CLOSED_STATUSES)
            ->with([
                'car:id,brand_id,name,license_plate',
                'car.brand:id,name',
                'customer:id,name',
                'assignee:id,name',
            ])
            ->get();

        $salesInPeriod = $activeSales->filter(
            fn (Sale $sale): bool => $sale->created_at !== null
                && $sale->created_at->timezone('Asia/Makassar')->between($periodStart, $periodEnd),
        );

        $paymentsInPeriod = $metrics->confirmedDealPayments($activeSales)
            ->filter(function ($payment) use ($periodStart, $periodEnd): bool {
                $value = $payment->getRawOriginal('payment_date');
                if (! is_string($value) || blank($value)) return false;
                $date = Carbon::parse($value, 'Asia/Makassar')->startOfDay();
                return $date->between($periodStart, $periodEnd);
            });

        $tradeInSalesInPeriod = $salesInPeriod->where('payment_type', 'trade_in');

        $summary = [
            'available' => $stockCars->where('status', 'available')->count(),
            'booked' => $stockCars->where('status', 'booked')->count(),
            'maintenance' => $stockCars->where('status', 'maintenance')->count(),
            'sales_this_month' => $salesInPeriod->count(),
            'turnover_this_month' => (int) $salesInPeriod->sum('deal_price'),
            'payments_this_month' => (int) $paymentsInPeriod->sum('amount'),
            'trade_in_this_month_count' => $tradeInSalesInPeriod->count(),
            'trade_in_this_month_value' => (int) $tradeInSalesInPeriod->sum('trade_in_price'),
            'active_capital' => (int) $stockCars->sum(function (Car $car): int {
                $capital = $car->getRelation('capital');
                return $capital instanceof Purchase && $capital->status !== 'cancelled'
                    ? $capital->total_capital
                    : 0;
            }),
            'incomplete_capital' => $stockCars->filter(function (Car $car): bool {
                $capital = $car->getRelation('capital');
                return ! ($capital instanceof Purchase) || $capital->status !== 'completed';
            })->count(),
            'customer_receivables' => (int) $activeSales->sum('customer_payment_shortfall'),
            'finance_receivables' => (int) $activeSales->sum('remaining_finance_disbursement'),
            'payment_breakdown' => [
                'cash_full' => [
                    'count' => $salesInPeriod->where('payment_type', 'cash_full')->count(),
                    'turnover' => (int) $salesInPeriod->where('payment_type', 'cash_full')->sum('deal_price'),
                ],
                'cash_tempo' => [
                    'count' => $salesInPeriod->where('payment_type', 'cash_tempo')->count(),
                    'turnover' => (int) $salesInPeriod->where('payment_type', 'cash_tempo')->sum('deal_price'),
                ],
                'credit' => [
                    'count' => $salesInPeriod->where('payment_type', 'credit')->count(),
                    'turnover' => (int) $salesInPeriod->where('payment_type', 'credit')->sum('deal_price'),
                ],
                'trade_in' => [
                    'count' => $tradeInSalesInPeriod->count(),
                    'turnover' => (int) $tradeInSalesInPeriod->sum('deal_price'),
                    'trade_in_value' => (int) $tradeInSalesInPeriod->sum('trade_in_price'),
                ],
            ],
        ];

        $financialAttention = $metrics->financialAttention($activeSales, $today);
        $operationalAttention = $metrics->operationalAttention(
            $activeSales,
            $openProcesses,
            $today,
        );

        return Inertia::render('dashboard', [
            'generated_at' => $now->toIso8601String(),
            'period' => $period,
            'period_label' => $periodLabel,
            'period_options' => [
                ['value' => 'this_month', 'label' => 'Bulan Ini'],
                ['value' => 'last_month', 'label' => 'Bulan Lalu'],
                ['value' => 'this_year', 'label' => 'Tahun Ini'],
            ],
            'summary' => $summary,
            'attention' => [
                'total' => $financialAttention->count() + $operationalAttention->count(),
                'financial' => $financialAttention->take(20)->values(),
                'operational' => $operationalAttention->take(20)->values(),
            ],
            'document_reminders' => $metrics->documentReminders($stockCars, $today)
                ->take(20)
                ->values(),
            'performance' => $metrics->performanceSeries($activeSales, $today),
            'stock_aging' => $metrics->stockAging($stockCars, $today, 15),
            'recent_sales' => $metrics->recentSales($activeSales, 15),
        ]);
    }
}

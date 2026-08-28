<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Car;
use App\Models\DocumentProcess;
use App\Models\Payment;
use App\Models\Purchase;
use App\Models\Sale;
use App\Models\VehicleDocument;
use App\Models\VehicleHandover;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /** @var array<int, string> */
    private const STOCK_STATUSES = ['available', 'booked', 'maintenance'];

    /** @var array<int, string> */
    private const MONTH_LABELS = [
        1 => 'Jan',
        2 => 'Feb',
        3 => 'Mar',
        4 => 'Apr',
        5 => 'Mei',
        6 => 'Jun',
        7 => 'Jul',
        8 => 'Agu',
        9 => 'Sep',
        10 => 'Okt',
        11 => 'Nov',
        12 => 'Des',
    ];

    public function __invoke(): Response
    {
        $now = Carbon::now('Asia/Makassar');
        $today = $now->copy()->startOfDay();
        $monthStart = $today->copy()->startOfMonth();

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

        $salesThisMonth = $activeSales->filter(
            fn (Sale $sale): bool => $sale->created_at !== null
                && $sale->created_at->timezone('Asia/Makassar')->greaterThanOrEqualTo($monthStart),
        );

        $paymentsThisMonth = $this->confirmedDealPayments($activeSales)
            ->filter(function (Payment $payment) use ($monthStart, $today): bool {
                $date = $this->dateAttribute($payment, 'payment_date');

                return $date !== null
                    && $date->greaterThanOrEqualTo($monthStart)
                    && $date->lessThanOrEqualTo($today);
            });

        $tradeInSalesThisMonth = $salesThisMonth->where('payment_type', 'trade_in');

        $summary = [
            'available' => $stockCars->where('status', 'available')->count(),
            'booked' => $stockCars->where('status', 'booked')->count(),
            'maintenance' => $stockCars->where('status', 'maintenance')->count(),
            'sales_this_month' => $salesThisMonth->count(),
            'turnover_this_month' => (int) $salesThisMonth->sum('deal_price'),
            'payments_this_month' => (int) $paymentsThisMonth->sum('amount'),
            'trade_in_this_month_count' => $tradeInSalesThisMonth->count(),
            'trade_in_this_month_value' => (int) $tradeInSalesThisMonth->sum('trade_in_price'),
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
                    'count' => $salesThisMonth->where('payment_type', 'cash_full')->count(),
                    'turnover' => (int) $salesThisMonth->where('payment_type', 'cash_full')->sum('deal_price'),
                ],
                'cash_tempo' => [
                    'count' => $salesThisMonth->where('payment_type', 'cash_tempo')->count(),
                    'turnover' => (int) $salesThisMonth->where('payment_type', 'cash_tempo')->sum('deal_price'),
                ],
                'credit' => [
                    'count' => $salesThisMonth->where('payment_type', 'credit')->count(),
                    'turnover' => (int) $salesThisMonth->where('payment_type', 'credit')->sum('deal_price'),
                ],
                'trade_in' => [
                    'count' => $tradeInSalesThisMonth->count(),
                    'turnover' => (int) $tradeInSalesThisMonth->sum('deal_price'),
                    'trade_in_value' => (int) $tradeInSalesThisMonth->sum('trade_in_price'),
                ],
            ],
        ];

        $financialAttention = $this->financialAttention($activeSales, $today);
        $operationalAttention = $this->operationalAttention(
            $activeSales,
            $openProcesses,
            $today,
        );

        return Inertia::render('dashboard', [
            'generated_at' => $now->toIso8601String(),
            'summary' => $summary,
            'attention' => [
                'total' => $financialAttention->count()
                    + $operationalAttention->count(),
                'financial' => $financialAttention->take(6)->values(),
                'operational' => $operationalAttention->take(6)->values(),
            ],
            'document_reminders' => $this->documentReminders($stockCars, $today)
                ->take(8)
                ->values(),
            'performance' => $this->performanceSeries($activeSales, $today),
            'stock_aging' => $this->stockAging($stockCars, $today),
            'recent_sales' => $this->recentSales($activeSales),
        ]);
    }

    /**
     * @param  EloquentCollection<int, Sale>  $sales
     * @return Collection<int, Payment>
     */
    private function confirmedDealPayments(EloquentCollection $sales): Collection
    {
        return $sales
            ->flatMap(fn (Sale $sale) => $sale->payments)
            ->filter(
                fn (Payment $payment): bool => $payment->status === 'confirmed'
                    && $payment->payment_category !== 'leasing_bonus',
            );
    }

    /**
     * @param  EloquentCollection<int, Sale>  $sales
     * @return Collection<int, array<string, mixed>>
     */
    private function financialAttention(
        EloquentCollection $sales,
        Carbon $today,
    ): Collection {
        $items = collect();
        $dueSoonLimit = $today->copy()->addDays(7);

        foreach ($sales as $sale) {
            $description = $this->saleDescription($sale);
            $dueDate = $this->dateAttribute($sale, 'due_date');

            if (
                $sale->payment_type === 'cash_tempo'
                && $sale->remaining_bill > 0
                && $dueDate !== null
                && $dueDate->lessThanOrEqualTo($dueSoonLimit)
            ) {
                $isOverdue = $dueDate->lessThan($today);
                $items->push([
                    'id' => "sale-payment-{$sale->id}",
                    'kind' => $isOverdue ? 'payment_overdue' : 'payment_due',
                    'severity' => $isOverdue ? 'danger' : 'warning',
                    'title' => $isOverdue
                        ? 'Pembayaran melewati jatuh tempo'
                        : 'Pembayaran segera jatuh tempo',
                    'description' => $description,
                    'amount' => $sale->remaining_bill,
                    'date' => $dueDate->toDateString(),
                    'href' => route('sales.show', $sale, false),
                    'action_label' => 'Lihat penjualan',
                ]);
            }

            if (
                $sale->payment_type === 'credit'
                && $sale->customer_payment_shortfall > 0
            ) {
                $items->push([
                    'id' => "sale-customer-shortfall-{$sale->id}",
                    'kind' => 'customer_shortfall',
                    'severity' => 'warning',
                    'title' => 'Kekurangan pembayaran customer',
                    'description' => $description,
                    'amount' => $sale->customer_payment_shortfall,
                    'date' => null,
                    'href' => route('sales.show', $sale, false),
                    'action_label' => 'Catat pembayaran',
                ]);
            }

            if (
                $sale->payment_type === 'credit'
                && $sale->remaining_finance_disbursement > 0
            ) {
                $estimatedDate = $this->dateAttribute(
                    $sale,
                    'disbursement_estimated_date',
                );
                $isOverdue = $estimatedDate !== null
                    && $estimatedDate->lessThan($today);
                $items->push([
                    'id' => "sale-finance-{$sale->id}",
                    'kind' => $isOverdue
                        ? 'finance_disbursement_overdue'
                        : 'finance_disbursement_pending',
                    'severity' => $isOverdue ? 'danger' : 'info',
                    'title' => $isOverdue
                        ? 'Pencairan leasing melewati estimasi'
                        : 'Menunggu pencairan leasing',
                    'description' => $description,
                    'amount' => $sale->remaining_finance_disbursement,
                    'date' => $estimatedDate?->toDateString(),
                    'href' => route('sales.show', $sale, false),
                    'action_label' => 'Lihat penjualan',
                ]);
            }
        }

        return $this->sortAttention($items);
    }

    /**
     * @param  EloquentCollection<int, Sale>  $sales
     * @param  EloquentCollection<int, DocumentProcess>  $processes
     * @return Collection<int, array<string, mixed>>
     */
    private function operationalAttention(
        EloquentCollection $sales,
        EloquentCollection $processes,
        Carbon $today,
    ): Collection {
        $items = collect();

        foreach ($sales as $sale) {
            $handover = $sale->handover;
            $hasVehicle = $handover instanceof VehicleHandover
                && $handover->hasDeliveredItem('vehicle');
            $hasBpkb = $handover instanceof VehicleHandover
                && $handover->hasDeliveredItem('bpkb');

            if ($sale->can_deliver_vehicle && ! $hasVehicle) {
                $items->push([
                    'id' => "handover-ready-{$sale->id}",
                    'kind' => 'handover_ready',
                    'severity' => 'info',
                    'title' => 'Unit siap diserahkan',
                    'description' => $this->saleDescription($sale),
                    'amount' => $sale->customer_payment_shortfall,
                    'date' => null,
                    'href' => route('handovers.create', $sale, false),
                    'action_label' => 'Catat penyerahan',
                ]);
            }

            if ($hasVehicle && ! $hasBpkb) {
                $items->push([
                    'id' => "handover-bpkb-{$sale->id}",
                    'kind' => 'bpkb_pending',
                    'severity' => $sale->can_deliver_bpkb ? 'warning' : 'info',
                    'title' => $sale->can_deliver_bpkb
                        ? 'BPKB siap diserahkan'
                        : 'BPKB masih ditahan',
                    'description' => $this->saleDescription($sale),
                    'amount' => $sale->customer_payment_shortfall,
                    'date' => null,
                    'href' => route('handovers.show', $sale, false),
                    'action_label' => 'Lihat tracking',
                ]);
            }
        }

        $nearTarget = $today->copy()->addDays(3);

        foreach ($processes as $process) {
            $target = $this->dateAttribute($process, 'estimated_completion_date');
            $isOverdue = $target !== null && $target->lessThan($today);
            $isNearTarget = $target !== null
                && $target->betweenIncluded($today, $nearTarget);

            if (
                $process->status !== 'issue'
                && $process->status !== 'completed'
                && ! $isOverdue
                && ! $isNearTarget
            ) {
                continue;
            }

            $title = match (true) {
                $process->status === 'issue' => 'Proses berkas bermasalah',
                $process->status === 'completed' => 'Dokumen selesai, belum dikembalikan',
                $isOverdue => 'Proses berkas melewati target',
                default => 'Target proses berkas sudah dekat',
            };
            $severity = match (true) {
                $process->status === 'issue', $isOverdue => 'danger',
                $process->status === 'completed' => 'warning',
                default => 'info',
            };

            $items->push([
                'id' => "document-process-{$process->id}",
                'kind' => 'document_process',
                'severity' => $severity,
                'title' => $title,
                'description' => $process->process_number.' · '.$this->processCarName($process),
                'amount' => null,
                'date' => $target?->toDateString(),
                'href' => route('document-processes.show', $process, false),
                'action_label' => 'Lihat proses',
            ]);
        }

        return $this->sortAttention($items);
    }

    /**
     * @param  EloquentCollection<int, Car>  $stockCars
     * @return Collection<int, array<string, mixed>>
     */
    private function documentReminders(
        EloquentCollection $stockCars,
        Carbon $today,
    ): Collection {
        $items = collect();

        foreach ($stockCars->where('status', 'available') as $car) {
            $documents = $car->documents->keyBy('document_type');
            $stnk = $documents->get('stnk');
            $bpkb = $documents->get('bpkb');
            $invoice = $documents->get('invoice');
            $activeProcess = $car->documentProcesses->first();
            $href = $activeProcess instanceof DocumentProcess
                ? route('document-processes.show', $activeProcess, false)
                : route('document-processes.create', ['car_id' => $car->id], false);
            $actionLabel = $activeProcess instanceof DocumentProcess
                ? 'Lihat proses aktif'
                : 'Buat proses berkas';

            if ($stnk instanceof VehicleDocument) {
                $annualDue = $this->dateAttribute($stnk, 'annual_tax_due_at');
                if (
                    $annualDue !== null
                    && $annualDue->lessThanOrEqualTo($today->copy()->addDays(30))
                ) {
                    $isExpired = $annualDue->lessThan($today);
                    $items->push([
                        'id' => "annual-tax-{$car->id}",
                        'kind' => 'annual_tax',
                        'severity' => $isExpired ? 'danger' : 'warning',
                        'title' => $isExpired
                            ? 'Pajak tahunan sudah lewat'
                            : 'Pajak tahunan segera jatuh tempo',
                        'car_name' => $this->carName($car),
                        'license_plate' => $car->license_plate,
                        'due_date' => $annualDue->toDateString(),
                        'has_active_process' => $activeProcess instanceof DocumentProcess,
                        'href' => $href,
                        'action_label' => $actionLabel,
                    ]);
                }

                $fiveYearDue = $this->dateAttribute($stnk, 'expires_at');
                if (
                    $fiveYearDue !== null
                    && $fiveYearDue->lessThanOrEqualTo($today->copy()->addDays(60))
                ) {
                    $isExpired = $fiveYearDue->lessThan($today);
                    $items->push([
                        'id' => "five-year-tax-{$car->id}",
                        'kind' => 'five_year_tax',
                        'severity' => $isExpired ? 'danger' : 'warning',
                        'title' => $isExpired
                            ? 'Masa berlaku STNK/plat sudah lewat'
                            : 'Masa berlaku STNK/plat segera habis',
                        'car_name' => $this->carName($car),
                        'license_plate' => $car->license_plate,
                        'due_date' => $fiveYearDue->toDateString(),
                        'has_active_process' => $activeProcess instanceof DocumentProcess,
                        'href' => $href,
                        'action_label' => $actionLabel,
                    ]);
                }
            }

            $missing = collect([
                ! ($stnk instanceof VehicleDocument) || $stnk->status !== 'complete'
                    ? 'STNK'
                    : null,
                ! ($bpkb instanceof VehicleDocument)
                    || ! in_array($bpkb->status, ['ready', 'uncollected'], true)
                        ? 'BPKB'
                        : null,
                ! ($invoice instanceof VehicleDocument) || $invoice->status !== 'ready'
                    ? 'Faktur'
                    : null,
            ])->filter()->values();

            if ($missing->isNotEmpty()) {
                $items->push([
                    'id' => "documents-incomplete-{$car->id}",
                    'kind' => 'documents_incomplete',
                    'severity' => 'info',
                    'title' => 'Dokumen kendaraan belum lengkap',
                    'car_name' => $this->carName($car),
                    'license_plate' => $car->license_plate,
                    'due_date' => null,
                    'detail' => $missing->join(', '),
                    'has_active_process' => $activeProcess instanceof DocumentProcess,
                    'href' => route('cars.show', $car, false),
                    'action_label' => 'Kelola dokumen',
                ]);
            }
        }

        return $this->sortAttention($items);
    }

    /**
     * @param  EloquentCollection<int, Sale>  $sales
     * @return array<int, array<string, mixed>>
     */
    private function performanceSeries(
        EloquentCollection $sales,
        Carbon $today,
    ): array {
        $months = collect(range(5, 0))->map(
            fn (int $offset): Carbon => $today->copy()->startOfMonth()->subMonths($offset),
        );
        $payments = $this->confirmedDealPayments($sales);

        return $months->map(function (Carbon $month) use ($sales, $payments): array {
            $key = $month->format('Y-m');
            $monthSales = $sales->filter(
                fn (Sale $sale): bool => $sale->created_at !== null
                    && $sale->created_at->timezone('Asia/Makassar')->format('Y-m') === $key,
            );
            $monthPayments = $payments->filter(function (Payment $payment) use ($key): bool {
                $paymentDate = $this->dateAttribute($payment, 'payment_date');

                return $paymentDate?->format('Y-m') === $key;
            });

            return [
                'key' => $key,
                'label' => self::MONTH_LABELS[$month->month].' '.$month->format('y'),
                'sales_count' => $monthSales->count(),
                'turnover' => (int) $monthSales->sum('deal_price'),
                'payments' => (int) $monthPayments->sum('amount'),
                'trade_in_count' => $monthSales->where('payment_type', 'trade_in')->count(),
                'trade_in_value' => (int) $monthSales->where('payment_type', 'trade_in')->sum('trade_in_price'),
            ];
        })->all();
    }

    /**
     * @param  EloquentCollection<int, Car>  $stockCars
     * @return array<int, array<string, mixed>>
     */
    private function stockAging(EloquentCollection $stockCars, Carbon $today): array
    {
        return $stockCars
            ->where('status', 'available')
            ->map(function (Car $car) use ($today): array {
                $capital = $car->getRelation('capital');
                $rawPurchaseDate = $capital instanceof Purchase
                    ? $capital->getRawOriginal('purchase_date')
                    : null;
                $stockDate = is_string($rawPurchaseDate)
                    ? Carbon::parse($rawPurchaseDate, 'Asia/Makassar')
                    : $car->created_at?->timezone('Asia/Makassar');

                return [
                    'id' => $car->id,
                    'car_name' => $this->carName($car),
                    'license_plate' => $car->license_plate,
                    'stock_date' => $stockDate?->toDateString(),
                    'days_in_stock' => $stockDate !== null
                        ? max(0, (int) $stockDate->copy()->startOfDay()->diffInDays($today))
                        : 0,
                    'capital' => $capital instanceof Purchase
                        && $capital->status !== 'cancelled'
                            ? $capital->total_capital
                            : null,
                    'capital_status' => $capital instanceof Purchase
                        ? $capital->status
                        : 'missing',
                    'selling_price' => $car->selling_price,
                    'href' => route('cars.show', $car, false),
                ];
            })
            ->sortByDesc('days_in_stock')
            ->take(5)
            ->values()
            ->all();
    }

    /**
     * @param  EloquentCollection<int, Sale>  $sales
     * @return array<int, array<string, mixed>>
     */
    private function recentSales(EloquentCollection $sales): array
    {
        return $sales
            ->sortByDesc('created_at')
            ->take(5)
            ->map(fn (Sale $sale): array => [
                'id' => $sale->id,
                'invoice_number' => $sale->invoice_number,
                'car_name' => $this->saleCarName($sale),
                'customer_name' => $sale->customer->name,
                'payment_type' => $sale->payment_type,
                'status' => $sale->status,
                'deal_price' => $sale->deal_price,
                'remaining_bill' => $sale->remaining_bill,
                'created_at' => $sale->created_at?->toIso8601String(),
                'href' => route('sales.show', $sale, false),
            ])
            ->values()
            ->all();
    }

    /**
     * @param  Collection<int, array<string, mixed>>  $items
     * @return Collection<int, array<string, mixed>>
     */
    private function sortAttention(Collection $items): Collection
    {
        $severityOrder = ['danger' => 0, 'warning' => 1, 'info' => 2];

        return $items->sort(function (array $first, array $second) use ($severityOrder): int {
            $severityComparison = ($severityOrder[$first['severity']] ?? 3)
                <=> ($severityOrder[$second['severity']] ?? 3);

            if ($severityComparison !== 0) {
                return $severityComparison;
            }

            $firstDate = (string) ($first['date'] ?? $first['due_date'] ?? '9999-12-31');
            $secondDate = (string) ($second['date'] ?? $second['due_date'] ?? '9999-12-31');

            return $firstDate <=> $secondDate;
        })->values();
    }

    private function saleDescription(Sale $sale): string
    {
        return $sale->invoice_number.' · '
            .$sale->customer->name.' · '
            .$this->saleCarName($sale);
    }

    private function saleCarName(Sale $sale): string
    {
        $car = $sale->car;

        if (! $car instanceof Car) {
            return 'Mobil diarsipkan';
        }

        return $this->carName($car);
    }

    private function processCarName(DocumentProcess $process): string
    {
        $car = $process->car;

        return $car instanceof Car ? $this->carName($car) : 'Mobil diarsipkan';
    }

    private function carName(Car $car): string
    {
        return collect([$car->brand->name, $car->name])
            ->filter()
            ->join(' ');
    }

    private function dateAttribute(Model $model, string $attribute): ?Carbon
    {
        $value = $model->getRawOriginal($attribute);

        if (! is_string($value) || blank($value)) {
            return null;
        }

        return Carbon::parse($value, 'Asia/Makassar')->startOfDay();
    }
}

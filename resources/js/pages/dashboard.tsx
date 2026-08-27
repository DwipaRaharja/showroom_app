import { Head, Link } from '@inertiajs/react';
import {
    ArrowRightIcon,
    CalendarDotsIcon,
    CarProfileIcon,
    CheckCircleIcon,
    ClockCountdownIcon,
    CoinsIcon,
    CurrencyCircleDollarIcon,
    FileTextIcon,
    KeyIcon,
    PlusIcon,
    WarningCircleIcon,
    WrenchIcon,
} from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import CarController from '@/actions/App/Http/Controllers/CarController';
import DocumentProcessController from '@/actions/App/Http/Controllers/DocumentProcessController';
import SaleController from '@/actions/App/Http/Controllers/SaleController';
import VehicleHandoverController from '@/actions/App/Http/Controllers/VehicleHandoverController';
import { StatCard } from '@/components/stat-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { AttentionCard } from '@/pages/dashboard/attention-card';
import { PerformanceChart } from '@/pages/dashboard/performance-chart';
import type {
    DashboardProps,
    DashboardSeverity,
    RecentSale,
} from '@/pages/dashboard/types';
import { dashboard } from '@/routes';

const currencyFormatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
});

const compactCurrencyFormatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    notation: 'compact',
    maximumFractionDigits: 1,
});

const fullDateFormatter = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Makassar',
});

const shortDateFormatter = new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
});

const reminderClasses: Record<DashboardSeverity, string> = {
    danger: 'border-red-500/30 bg-red-500/5',
    warning: 'border-amber-500/30 bg-amber-500/5',
    info: 'border-blue-500/30 bg-blue-500/5',
};

const saleStatusLabels: Record<RecentSale['status'], string> = {
    pending: 'Belum dibayar',
    partial: 'Dibayar sebagian',
    completed: 'Lunas',
    cancelled: 'Dibatalkan',
};

const paymentTypeLabels: Record<RecentSale['payment_type'], string> = {
    cash_full: 'Tunai lunas',
    cash_tempo: 'Tunai tempo',
    credit: 'Kredit leasing',
};

function parseLocalDate(value: string): Date {
    return new Date(`${value.slice(0, 10)}T00:00:00`);
}

function FinancialMetric({
    label,
    value,
    description,
    tone = 'default',
}: {
    label: string;
    value: string;
    description: string;
    tone?: 'default' | 'danger' | 'warning' | 'info';
}) {
    return (
        <div className="rounded-xl border bg-card p-4">
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <p
                className={cn(
                    'mt-1 text-lg font-bold tracking-tight tabular-nums',
                    tone === 'danger' && 'text-red-500',
                    tone === 'warning' && 'text-amber-600 dark:text-amber-400',
                    tone === 'info' && 'text-blue-600 dark:text-blue-400',
                )}
            >
                {value}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>
    );
}

function SectionHeader({
    title,
    description,
    action,
}: {
    title: string;
    description: string;
    action?: ReactNode;
}) {
    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </div>
            {action}
        </div>
    );
}

export default function Dashboard({
    generated_at: generatedAt,
    summary,
    attention,
    document_reminders: documentReminders,
    performance,
    stock_aging: stockAging,
    recent_sales: recentSales,
}: DashboardProps) {
    return (
        <>
            <Head title="Dashboard" />

            <div className="flex h-full min-w-0 flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-2xl font-semibold tracking-tight">
                                Dashboard
                            </h1>
                            {attention.total > 0 && (
                                <Badge className="border-red-500/30 bg-red-500/10 text-red-500">
                                    {attention.total} perlu ditindaklanjuti
                                </Badge>
                            )}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Ringkasan operasional showroom untuk{' '}
                            {fullDateFormatter.format(new Date(generatedAt))}.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Button asChild variant="outline">
                            <Link href={CarController.create.url()}>
                                <CarProfileIcon />
                                Tambah Mobil
                            </Link>
                        </Button>
                        <Button asChild>
                            <Link href={SaleController.create.url()}>
                                <PlusIcon />
                                Buat Penjualan
                            </Link>
                        </Button>
                        <Button asChild variant="outline">
                            <Link href={DocumentProcessController.create.url()}>
                                <FileTextIcon />
                                Proses Berkas
                            </Link>
                        </Button>
                        <Button asChild variant="outline">
                            <Link href={VehicleHandoverController.index.url()}>
                                <KeyIcon />
                                Penyerahan Unit
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        title="Unit Ready"
                        value={`${summary.available} Unit`}
                        description={`${summary.maintenance} unit dalam perbaikan`}
                        icon={CheckCircleIcon}
                        variant="success"
                    />
                    <StatCard
                        title="Unit Booking"
                        value={`${summary.booked} Unit`}
                        description="Memiliki transaksi yang belum selesai"
                        icon={ClockCountdownIcon}
                        variant="warning"
                    />
                    <StatCard
                        title="Penjualan Bulan Ini"
                        value={`${summary.sales_this_month} Transaksi`}
                        description={compactCurrencyFormatter.format(
                            summary.turnover_this_month,
                        )}
                        icon={CarProfileIcon}
                        variant="info"
                    />
                    <StatCard
                        title="Pembayaran Masuk Bulan Ini"
                        value={compactCurrencyFormatter.format(
                            summary.payments_this_month,
                        )}
                        description="Pembayaran terkonfirmasi, tanpa bonus leasing"
                        icon={CurrencyCircleDollarIcon}
                        variant="success"
                        valueClassName="text-base"
                    />
                </div>

                <Card className="gap-0 overflow-hidden py-0">
                    <CardHeader className="border-b px-5 py-5">
                        <SectionHeader
                            title="Posisi Finansial Operasional"
                            description="Modal yang tertahan dan penerimaan yang masih harus diselesaikan."
                            action={
                                summary.incomplete_capital > 0 ? (
                                    <Badge className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300">
                                        <WarningCircleIcon />
                                        {summary.incomplete_capital} modal belum
                                        lengkap
                                    </Badge>
                                ) : undefined
                            }
                        />
                    </CardHeader>
                    <CardContent className="grid gap-3 bg-muted/15 p-4 sm:grid-cols-2 xl:grid-cols-4">
                        <FinancialMetric
                            label="Total modal stok aktif"
                            value={currencyFormatter.format(
                                summary.active_capital,
                            )}
                            description="Unit ready, booking, dan perbaikan"
                            tone="warning"
                        />
                        <FinancialMetric
                            label="Piutang customer"
                            value={currencyFormatter.format(
                                summary.customer_receivables,
                            )}
                            description="Kewajiban pembayaran dari customer"
                            tone={
                                summary.customer_receivables > 0
                                    ? 'danger'
                                    : 'default'
                            }
                        />
                        <FinancialMetric
                            label="Dana leasing belum masuk"
                            value={currencyFormatter.format(
                                summary.finance_receivables,
                            )}
                            description="Pokok pembiayaan yang belum dicairkan"
                            tone="info"
                        />
                        <FinancialMetric
                            label="Nilai transaksi bulan ini"
                            value={currencyFormatter.format(
                                summary.turnover_this_month,
                            )}
                            description={`${summary.sales_this_month} transaksi tidak dibatalkan`}
                        />
                    </CardContent>
                </Card>

                <div className="grid min-w-0 gap-6 xl:grid-cols-2">
                    <AttentionCard
                        title="Keuangan Perlu Ditindaklanjuti"
                        description="Jatuh tempo, kekurangan customer, dan pencairan leasing."
                        items={attention.financial}
                        emptyText="Tidak ada pembayaran mendesak atau pencairan yang tertunda."
                    />
                    <AttentionCard
                        title="Operasional Perlu Ditindaklanjuti"
                        description="Penyerahan unit, BPKB, dan proses berkas."
                        items={attention.operational}
                        emptyText="Tidak ada penyerahan atau proses berkas yang membutuhkan tindakan."
                    />
                </div>

                <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(22rem,0.85fr)_minmax(0,1.4fr)]">
                    <Card className="min-w-0 gap-0 overflow-hidden py-0">
                        <CardHeader className="border-b px-5 py-5">
                            <SectionHeader
                                title="Pengingat Pajak & Dokumen"
                                description="Khusus kendaraan ready yang perlu segera diperiksa."
                                action={
                                    <Badge variant="secondary">
                                        {documentReminders.length}
                                    </Badge>
                                }
                            />
                        </CardHeader>
                        <CardContent className="p-0">
                            {documentReminders.length === 0 ? (
                                <div className="flex min-h-64 flex-col items-center justify-center gap-2 px-6 text-center">
                                    <div className="flex size-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                                        <CheckCircleIcon
                                            className="size-5"
                                            weight="fill"
                                        />
                                    </div>
                                    <p className="text-sm font-medium">
                                        Pajak dan dokumen aman
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Tidak ada pengingat untuk unit ready
                                        saat ini.
                                    </p>
                                </div>
                            ) : (
                                <div className="divide-y p-3">
                                    {documentReminders.map((reminder) => (
                                        <div
                                            key={reminder.id}
                                            className={cn(
                                                'mb-2 rounded-xl border p-3 last:mb-0',
                                                reminderClasses[
                                                    reminder.severity
                                                ],
                                            )}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-background/80">
                                                    {reminder.kind ===
                                                    'documents_incomplete' ? (
                                                        <FileTextIcon className="size-4" />
                                                    ) : (
                                                        <CalendarDotsIcon className="size-4" />
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-semibold">
                                                        {reminder.title}
                                                    </p>
                                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                                        {reminder.car_name} ·{' '}
                                                        {reminder.license_plate ??
                                                            'Tanpa plat'}
                                                    </p>
                                                    {reminder.detail && (
                                                        <p className="mt-1 text-xs font-medium">
                                                            Belum lengkap:{' '}
                                                            {reminder.detail}
                                                        </p>
                                                    )}
                                                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {reminder.due_date && (
                                                                <Badge
                                                                    variant="outline"
                                                                    className="bg-background/70"
                                                                >
                                                                    {shortDateFormatter.format(
                                                                        parseLocalDate(
                                                                            reminder.due_date,
                                                                        ),
                                                                    )}
                                                                </Badge>
                                                            )}
                                                            {reminder.has_active_process && (
                                                                <Badge variant="secondary">
                                                                    Proses aktif
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <Button
                                                            asChild
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-7 px-2 text-xs"
                                                        >
                                                            <Link
                                                                href={
                                                                    reminder.href
                                                                }
                                                            >
                                                                {
                                                                    reminder.action_label
                                                                }
                                                                <ArrowRightIcon />
                                                            </Link>
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <PerformanceChart data={performance} />
                </div>

                <div className="grid min-w-0 gap-6 xl:grid-cols-2">
                    <Card className="min-w-0 gap-0 overflow-hidden py-0">
                        <CardHeader className="border-b px-5 py-5">
                            <SectionHeader
                                title="Stok Ready Terlama"
                                description="Prioritas unit berdasarkan lama berada di stok."
                                action={
                                    <Button asChild variant="ghost" size="sm">
                                        <Link href={CarController.index.url()}>
                                            Lihat semua
                                            <ArrowRightIcon />
                                        </Link>
                                    </Button>
                                }
                            />
                        </CardHeader>
                        <CardContent className="p-0">
                            {stockAging.length === 0 ? (
                                <div className="flex min-h-48 items-center justify-center px-6 text-sm text-muted-foreground">
                                    Belum ada unit ready.
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {stockAging.map((car, index) => (
                                        <Link
                                            key={car.id}
                                            href={car.href}
                                            className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-muted/40"
                                        >
                                            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-semibold">
                                                {index + 1}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className="truncate text-sm font-semibold">
                                                        {car.car_name}
                                                    </p>
                                                    <Badge variant="outline">
                                                        {car.days_in_stock} hari
                                                    </Badge>
                                                </div>
                                                <p className="mt-0.5 text-xs text-muted-foreground">
                                                    {car.license_plate ??
                                                        'Tanpa plat'}{' '}
                                                    · Jual{' '}
                                                    {compactCurrencyFormatter.format(
                                                        car.selling_price,
                                                    )}
                                                </p>
                                            </div>
                                            <div className="shrink-0 text-right">
                                                {car.capital !== null ? (
                                                    <>
                                                        <p className="text-xs text-muted-foreground">
                                                            Modal
                                                        </p>
                                                        <p className="text-sm font-semibold tabular-nums">
                                                            {compactCurrencyFormatter.format(
                                                                car.capital,
                                                            )}
                                                        </p>
                                                    </>
                                                ) : (
                                                    <Badge className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300">
                                                        Modal belum lengkap
                                                    </Badge>
                                                )}
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="min-w-0 gap-0 overflow-hidden py-0">
                        <CardHeader className="border-b px-5 py-5">
                            <SectionHeader
                                title="Penjualan Terbaru"
                                description="Lima transaksi terakhir yang tidak dibatalkan."
                                action={
                                    <Button asChild variant="ghost" size="sm">
                                        <Link href={SaleController.index.url()}>
                                            Lihat semua
                                            <ArrowRightIcon />
                                        </Link>
                                    </Button>
                                }
                            />
                        </CardHeader>
                        <CardContent className="p-0">
                            {recentSales.length === 0 ? (
                                <div className="flex min-h-48 items-center justify-center px-6 text-sm text-muted-foreground">
                                    Belum ada transaksi penjualan.
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {recentSales.map((sale) => (
                                        <Link
                                            key={sale.id}
                                            href={sale.href}
                                            className="flex items-start gap-3 px-5 py-4 transition-colors hover:bg-muted/40"
                                        >
                                            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                                <CoinsIcon className="size-4" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className="font-mono text-xs font-semibold text-primary">
                                                        {sale.invoice_number}
                                                    </p>
                                                    <Badge
                                                        variant="outline"
                                                        className={cn(
                                                            sale.status ===
                                                                'completed' &&
                                                                'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
                                                            sale.status !==
                                                                'completed' &&
                                                                'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
                                                        )}
                                                    >
                                                        {
                                                            saleStatusLabels[
                                                                sale.status
                                                            ]
                                                        }
                                                    </Badge>
                                                </div>
                                                <p className="mt-1 truncate text-sm font-semibold">
                                                    {sale.car_name}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {sale.customer_name} ·{' '}
                                                    {
                                                        paymentTypeLabels[
                                                            sale.payment_type
                                                        ]
                                                    }
                                                </p>
                                            </div>
                                            <div className="shrink-0 text-right">
                                                <p className="text-sm font-semibold tabular-nums">
                                                    {compactCurrencyFormatter.format(
                                                        sale.deal_price,
                                                    )}
                                                </p>
                                                {sale.remaining_bill > 0 && (
                                                    <p className="mt-1 text-xs text-red-500">
                                                        Sisa{' '}
                                                        {compactCurrencyFormatter.format(
                                                            sale.remaining_bill,
                                                        )}
                                                    </p>
                                                )}
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="flex flex-col gap-2 rounded-xl border border-dashed bg-muted/20 px-4 py-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                    <span>
                        Keuntungan belum ditampilkan karena modal draft atau
                        belum lengkap dapat membuat hasilnya tidak akurat.
                    </span>
                    <div className="flex items-center gap-2">
                        <WrenchIcon />
                        Data diperbarui saat halaman dibuka
                    </div>
                </div>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};

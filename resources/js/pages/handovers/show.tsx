import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeftIcon,
    CalendarBlankIcon,
    CarProfileIcon,
    CheckCircleIcon,
    ClockCounterClockwiseIcon,
    KeyIcon,
    PlusIcon,
    PrinterIcon,
    ShieldCheckIcon,
    UserIcon,
} from '@phosphor-icons/react';
import { useState } from 'react';
import VehicleHandoverController from '@/actions/App/Http/Controllers/VehicleHandoverController';
import { StatCard } from '@/components/stat-card';
import { StatusBadge } from '@/components/status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { TimelineEvent } from '@/pages/handovers/timeline-event';
import { HandoverDialog } from '@/pages/sales/handover-dialog';
import type { Sale } from '@/pages/sales/types';
import { index as handoversIndex, show as handoversShow } from '@/routes/handovers';

type Props = {
    sale: Sale;
};

const currencyFormatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
});

const paymentTypeLabels: Record<string, string> = {
    cash_full: 'Cash Keras',
    cash_tempo: 'Cash Tempo',
    credit: 'Kredit Leasing',
};

export default function HandoverShow({ sale }: Props) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const events = sale.handover?.events ?? [];
    const remainingBill = sale.remaining_bill ?? sale.deal_price;
    const canDeliverVehicle =
        sale.can_deliver_vehicle ?? remainingBill <= 10_000_000;
    const canDeliverBpkb = sale.can_deliver_bpkb ?? remainingBill <= 0;
    const isSettled = sale.is_settled ?? remainingBill <= 0;
    const unitDelivered = sale.handover?.vehicle_delivered_at != null;
    const bpkbDelivered = sale.handover?.bpkb_delivered_at != null;

    const unitStatusLabel = unitDelivered
        ? 'Sudah Diserahkan'
        : canDeliverVehicle
          ? 'Siap Diserahkan'
          : 'Terkunci';
    const unitStatusVariant = unitDelivered
        ? 'success'
        : canDeliverVehicle
          ? 'warning'
          : 'danger';

    const bpkbStatusLabel = bpkbDelivered
        ? 'Sudah Diserahkan'
        : isSettled
          ? 'Siap (Lunas)'
          : 'Ditahan';
    const bpkbStatusVariant = bpkbDelivered
        ? 'success'
        : isSettled
          ? 'info'
          : 'warning';

    return (
        <>
            <Head title={`Tracking ${sale.invoice_number}`} />

            <div className="flex h-full min-w-0 flex-1 flex-col gap-6 p-4 md:p-6">
                {/* Page Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3">
                        <Button
                            variant="outline"
                            size="icon"
                            className="mt-0.5 shrink-0"
                            asChild
                        >
                            <Link href={handoversIndex.url()}>
                                <ArrowLeftIcon />
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-2xl font-semibold tracking-tight">
                                Tracking Penyerahan
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                {sale.invoice_number} ·{' '}
                                {sale.car?.brand?.name} {sale.car?.name}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            onClick={() => setIsDialogOpen(true)}
                            disabled={
                                sale.status === 'cancelled' ||
                                (!canDeliverVehicle && !unitDelivered)
                            }
                        >
                            <PlusIcon className="size-4" />
                            Tambah Tracking
                        </Button>
                        {unitDelivered && (
                            <Button variant="outline" asChild>
                                <Link
                                    href={VehicleHandoverController.printBast.url(
                                        sale.id,
                                    )}
                                >
                                    <PrinterIcon className="size-4" />
                                    Cetak BAST
                                </Link>
                            </Button>
                        )}
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        title="Sisa Tagihan"
                        value={currencyFormatter.format(remainingBill)}
                        icon={KeyIcon}
                        variant={remainingBill <= 0 ? 'success' : 'danger'}
                        valueClassName="text-base"
                    />
                    <StatCard
                        title="Status Unit Fisik"
                        value={unitStatusLabel}
                        icon={
                            unitDelivered ? CheckCircleIcon : CarProfileIcon
                        }
                        variant={
                            unitStatusVariant as
                                | 'success'
                                | 'warning'
                                | 'danger'
                        }
                    />
                    <StatCard
                        title="Status BPKB"
                        value={bpkbStatusLabel}
                        icon={ShieldCheckIcon}
                        variant={
                            bpkbStatusVariant as
                                | 'success'
                                | 'info'
                                | 'warning'
                        }
                    />
                    <StatCard
                        title="Total Tracking"
                        value={events.length}
                        icon={ClockCounterClockwiseIcon}
                        description={
                            sale.handover
                                ? `BAST: ${sale.handover.handover_number}`
                                : 'Belum ada tracking'
                        }
                    />
                </div>

                {/* Transaction Info */}
                <Card className="shadow-xs">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm">
                            Informasi Transaksi
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-6 sm:grid-cols-2">
                            {/* Car info */}
                            <div className="space-y-3">
                                <h4 className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                                    <CarProfileIcon className="size-3.5" />
                                    Data Kendaraan
                                </h4>
                                <div className="grid gap-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">
                                            Unit
                                        </span>
                                        <span className="font-medium">
                                            {sale.car?.brand?.name}{' '}
                                            {sale.car?.name}
                                        </span>
                                    </div>
                                    {sale.car?.license_plate && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">
                                                Plat Nomor
                                            </span>
                                            <Badge
                                                variant="outline"
                                                className="font-mono"
                                            >
                                                {sale.car.license_plate}
                                            </Badge>
                                        </div>
                                    )}
                                    {sale.car?.year && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">
                                                Tahun
                                            </span>
                                            <span className="font-medium">
                                                {sale.car.year}
                                            </span>
                                        </div>
                                    )}
                                    {sale.car?.color && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">
                                                Warna
                                            </span>
                                            <span className="font-medium">
                                                {sale.car.color}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">
                                            Status
                                        </span>
                                        <StatusBadge
                                            status={
                                                sale.car?.status ?? 'booked'
                                            }
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Buyer info */}
                            <div className="space-y-3">
                                <h4 className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                                    <UserIcon className="size-3.5" />
                                    Data Pembeli & Keuangan
                                </h4>
                                <div className="grid gap-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">
                                            Pembeli
                                        </span>
                                        <span className="font-medium">
                                            {sale.customer?.name ?? '—'}
                                        </span>
                                    </div>
                                    {sale.customer?.phone && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">
                                                No. HP
                                            </span>
                                            <span className="font-medium">
                                                {sale.customer.phone}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">
                                            Metode Bayar
                                        </span>
                                        <span className="font-medium">
                                            {paymentTypeLabels[
                                                sale.payment_type
                                            ] ?? sale.payment_type}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">
                                            Harga Deal
                                        </span>
                                        <span className="font-semibold">
                                            {currencyFormatter.format(
                                                sale.deal_price,
                                            )}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">
                                            Terbayar
                                        </span>
                                        <span className="font-medium text-emerald-600 dark:text-emerald-400">
                                            {currencyFormatter.format(
                                                sale.total_paid ?? 0,
                                            )}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">
                                            Status
                                        </span>
                                        <StatusBadge status={sale.status} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Timeline */}
                <Card className="shadow-xs">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-sm">
                                    Riwayat Tracking
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    {events.length > 0
                                        ? `${events.length} kejadian tercatat`
                                        : 'Belum ada riwayat penyerahan'}
                                </CardDescription>
                            </div>
                            {events.length > 0 && (
                                <Badge variant="outline">
                                    <CalendarBlankIcon className="size-3" />
                                    {events.length} event
                                </Badge>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        {events.length > 0 ? (
                            <div className="space-y-4">
                                {events.map((event) => (
                                    <TimelineEvent
                                        key={event.id}
                                        event={event}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-3 py-12 text-center">
                                <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                                    <ClockCounterClockwiseIcon className="size-6 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="font-medium">
                                        Belum ada riwayat penyerahan
                                    </p>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {canDeliverVehicle
                                            ? 'Transaksi ini siap untuk dicatat penyerahannya.'
                                            : 'Sisa tagihan masih melebihi batas Rp 10.000.000.'}
                                    </p>
                                </div>
                                <Button
                                    size="sm"
                                    onClick={() => setIsDialogOpen(true)}
                                    disabled={!canDeliverVehicle}
                                >
                                    <PlusIcon className="size-4" />
                                    Tambah Tracking Pertama
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Handover Dialog */}
            <HandoverDialog
                key={`${sale.id}-${sale.handover?.updated_at ?? 'new'}`}
                open={isDialogOpen}
                sale={sale}
                onOpenChange={setIsDialogOpen}
            />
        </>
    );
}

HandoverShow.layout = {
    breadcrumbs: [
        {
            title: 'Penyerahan Unit',
            href: handoversIndex.url(),
        },
        {
            title: 'Detail Tracking',
        },
    ],
};

import { Head, Link } from '@inertiajs/react';
import {
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
import VehicleHandoverController from '@/actions/App/Http/Controllers/VehicleHandoverController';
import { CardSectionHeader } from '@/components/card-section-header';
import { DataRow } from '@/components/detail-item';
import { PageContainer } from '@/components/page-container';
import { PageHeader } from '@/components/page-header';
import { StatCard } from '@/components/stat-card';
import { StatCardGrid } from '@/components/stat-card-grid';
import { StatusBadge } from '@/components/status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/formatters';
import { TimelineEvent } from '@/pages/handovers/timeline-event';
import type { Sale } from '@/pages/sales/types';
import { index as handoversIndex } from '@/routes/handovers';

type Props = {
    sale: Sale;
};

const paymentTypeLabels: Record<string, string> = {
    cash_full: 'Cash Keras',
    cash_tempo: 'Cash Tempo',
    credit: 'Kredit Leasing',
    trade_in: 'Tukar Tambah',
};

export default function HandoverShow({ sale }: Props) {
    const events = sale.handover?.events ?? [];
    const remainingBill = sale.remaining_bill ?? sale.deal_price;
    const canDeliverVehicle =
        sale.can_deliver_vehicle ?? remainingBill <= 10_000_000;
    const canDeliverBpkb = sale.can_deliver_bpkb ?? remainingBill <= 0;
    const unitDelivered = sale.handover?.vehicle_delivered_at != null;
    const bpkbDelivered = sale.handover?.bpkb_delivered_at != null;
    const canAddTracking =
        sale.status !== 'cancelled' && (canDeliverVehicle || unitDelivered);

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
        : !unitDelivered
          ? 'Menunggu Unit'
          : canDeliverBpkb
            ? sale.payment_type === 'credit'
                ? 'Siap ke Leasing'
                : 'Siap (Lunas)'
            : 'Ditahan';
    const bpkbStatusVariant = bpkbDelivered
        ? 'success'
        : !unitDelivered
          ? 'warning'
          : canDeliverBpkb
            ? 'info'
            : 'warning';

    return (
        <>
            <Head title={`Tracking ${sale.invoice_number}`} />

            <PageContainer>
                <PageHeader
                    backHref={handoversIndex.url()}
                    backLabel="Kembali ke penyerahan"
                    title="Tracking Penyerahan"
                    description={
                        <>
                            {sale.invoice_number} · {sale.car?.brand?.name}{' '}
                            {sale.car?.name}
                        </>
                    }
                    actions={
                        <>
                            {canAddTracking ? (
                                <Button asChild>
                                    <Link
                                        href={VehicleHandoverController.create.url(
                                            sale.id,
                                        )}
                                    >
                                        <PlusIcon className="size-4" />
                                        Tambah Tracking
                                    </Link>
                                </Button>
                            ) : (
                                <Button disabled>
                                    <PlusIcon className="size-4" />
                                    Tambah Tracking
                                </Button>
                            )}
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
                        </>
                    }
                />

                <StatCardGrid>
                    <StatCard
                        title="Sisa Tagihan"
                        value={formatCurrency(remainingBill)}
                        icon={KeyIcon}
                        variant={remainingBill <= 0 ? 'success' : 'danger'}
                        valueClassName="text-base"
                    />
                    <StatCard
                        title="Status Unit Fisik"
                        value={unitStatusLabel}
                        icon={unitDelivered ? CheckCircleIcon : CarProfileIcon}
                        variant={
                            unitStatusVariant as
                                'success' | 'warning' | 'danger'
                        }
                    />
                    <StatCard
                        title="Status BPKB"
                        value={bpkbStatusLabel}
                        icon={ShieldCheckIcon}
                        variant={
                            bpkbStatusVariant as 'success' | 'info' | 'warning'
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
                </StatCardGrid>

                {/* Transaction Info */}
                <Card className="shadow-xs">
                    <CardSectionHeader
                        className="pb-3"
                        title="Informasi Transaksi"
                        titleClassName="text-sm font-semibold"
                    />
                    <CardContent>
                        <div className="grid gap-6 sm:grid-cols-2">
                            {/* Car info */}
                            <div className="space-y-3">
                                <h4 className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                                    <CarProfileIcon className="size-3.5" />
                                    Data Kendaraan
                                </h4>
                                <div className="space-y-0.5 text-sm">
                                    <DataRow
                                        label="Unit"
                                        value={`${sale.car?.brand?.name ?? ''} ${sale.car?.name ?? ''}`}
                                    />
                                    {sale.car?.license_plate && (
                                        <DataRow
                                            label="Plat Nomor"
                                            value={sale.car.license_plate}
                                            mono
                                        />
                                    )}
                                    {sale.car?.year && (
                                        <DataRow
                                            label="Tahun"
                                            value={sale.car.year}
                                        />
                                    )}
                                    {sale.car?.color && (
                                        <DataRow
                                            label="Warna"
                                            value={sale.car.color}
                                        />
                                    )}
                                </div>
                            </div>

                            {/* Buyer info */}
                            <div className="space-y-3">
                                <h4 className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                                    <UserIcon className="size-3.5" />
                                    Data Pembeli & Keuangan
                                </h4>
                                <div className="space-y-0.5 text-sm">
                                    <DataRow
                                        label="Pembeli"
                                        value={sale.customer?.name ?? '—'}
                                    />
                                    {sale.customer?.phone && (
                                        <DataRow
                                            label="No. HP"
                                            value={sale.customer.phone}
                                            mono
                                        />
                                    )}
                                    <DataRow
                                        label="Metode Bayar"
                                        value={
                                            paymentTypeLabels[
                                                sale.payment_type
                                            ] ?? sale.payment_type
                                        }
                                    />
                                    <DataRow
                                        label="Harga Deal"
                                        value={formatCurrency(sale.deal_price)}
                                        valueClassName="font-semibold"
                                    />
                                    <DataRow
                                        label="Terbayar"
                                        value={formatCurrency(
                                            sale.total_paid ?? 0,
                                        )}
                                        valueClassName="font-medium text-emerald-600 dark:text-emerald-400"
                                    />
                                    <DataRow
                                        label="Status"
                                        value=""
                                        badge={
                                            <StatusBadge status={sale.status} />
                                        }
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Timeline */}
                <Card className="shadow-xs">
                    <CardSectionHeader
                        className="pb-3"
                        title="Riwayat Tracking"
                        titleClassName="text-sm font-semibold"
                        description={
                            events.length > 0
                                ? `${events.length} kejadian tercatat`
                                : 'Belum ada riwayat penyerahan'
                        }
                        descriptionClassName="text-xs"
                        action={
                            events.length > 0 ? (
                                <Badge variant="outline">
                                    <CalendarBlankIcon className="size-3" />
                                    {events.length} event
                                </Badge>
                            ) : null
                        }
                    />
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
                                {canDeliverVehicle ? (
                                    <Button size="sm" asChild>
                                        <Link
                                            href={VehicleHandoverController.create.url(
                                                sale.id,
                                            )}
                                        >
                                            <PlusIcon className="size-4" />
                                            Tambah Tracking Pertama
                                        </Link>
                                    </Button>
                                ) : (
                                    <Button size="sm" disabled>
                                        <PlusIcon className="size-4" />
                                        Tambah Tracking Pertama
                                    </Button>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </PageContainer>
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

import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeftIcon,
    CalendarDotsIcon,
    CheckCircleIcon,
    ClockCounterClockwiseIcon,
    CurrencyCircleDollarIcon,
    FileArrowDownIcon,
    FileTextIcon,
    MapPinIcon,
    PlusIcon,
    UserIcon,
} from '@phosphor-icons/react';
import { useState } from 'react';
import DocumentProcessController from '@/actions/App/Http/Controllers/DocumentProcessController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { ProcessCostDialog } from '@/pages/document-processes/process-cost-dialog';
import { ProcessEventDialog } from '@/pages/document-processes/process-event-dialog';
import type {
    DocumentProcess,
    LabelOptions,
} from '@/pages/document-processes/types';

type Props = {
    process: DocumentProcess;
    type_options: LabelOptions;
    status_options: LabelOptions;
};

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
});

const dateTimeFormatter = new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Makassar',
    timeZoneName: 'short',
});

const currencyFormatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
});

const statusClasses: Record<string, string> = {
    waiting_documents:
        'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
    documents_ready:
        'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300',
    submitted:
        'border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300',
    processing:
        'border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300',
    ready_for_pickup:
        'border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300',
    completed:
        'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    returned:
        'border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-300',
    issue: 'border-red-500/30 bg-red-500/10 text-red-500',
    cancelled: 'border-muted bg-muted text-muted-foreground',
};

const custodyLabels: Record<string, string> = {
    waiting: 'Belum diterima',
    received: 'Diterima showroom',
    submitted: 'Diserahkan ke pengurus',
    returned: 'Dikembalikan',
    missing: 'Bermasalah / hilang',
};

function formatDate(value: string | null): string {
    return value ? dateFormatter.format(new Date(value)) : 'Belum ditentukan';
}

function Detail({ label, value }: { label: string; value: string }) {
    return (
        <div className="grid gap-0.5">
            <span className="text-xs font-medium text-muted-foreground">
                {label}
            </span>
            <span className="text-sm font-medium">{value}</span>
        </div>
    );
}

export default function DocumentProcessShow({
    process,
    type_options: typeOptions,
    status_options: statusOptions,
}: Props) {
    const [isEventOpen, setIsEventOpen] = useState(false);
    const [isCostOpen, setIsCostOpen] = useState(false);
    const isTerminal = ['returned', 'cancelled'].includes(process.status);
    const carName = [process.car.brand?.name, process.car.name]
        .filter(Boolean)
        .join(' ');

    return (
        <>
            <Head title={`Proses ${process.process_number}`} />

            <div className="flex h-full min-w-0 flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex items-start gap-3">
                        <Button variant="outline" size="icon" asChild>
                            <Link
                                href={DocumentProcessController.index.url()}
                                aria-label="Kembali ke proses berkas"
                            >
                                <ArrowLeftIcon />
                            </Link>
                        </Button>
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="font-mono text-xl font-semibold tracking-tight md:text-2xl">
                                    {process.process_number}
                                </h1>
                                <Badge
                                    variant="outline"
                                    className={statusClasses[process.status]}
                                >
                                    {statusOptions[process.status]}
                                </Badge>
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {carName} ·{' '}
                                {process.car.license_plate ?? 'Tanpa plat'}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setIsCostOpen(true)}
                            disabled={process.status === 'cancelled'}
                        >
                            <CurrencyCircleDollarIcon />
                            Tambah Biaya
                        </Button>
                        <Button
                            onClick={() => setIsEventOpen(true)}
                            disabled={isTerminal}
                        >
                            <PlusIcon />
                            Catat Perkembangan
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(20rem,0.8fr)]">
                    <div className="grid min-w-0 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Informasi Proses</CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                                <Detail
                                    label="Jenis proses"
                                    value={
                                        typeOptions[process.process_type] ??
                                        process.process_type
                                    }
                                />
                                <Detail
                                    label="Kendaraan"
                                    value={`${carName} · ${process.car.license_plate ?? 'Tanpa plat'}`}
                                />
                                <Detail
                                    label="Customer"
                                    value={
                                        process.customer?.name ??
                                        'Proses internal showroom'
                                    }
                                />
                                <Detail
                                    label="Penanggung jawab"
                                    value={
                                        process.assignee?.name ??
                                        'Belum ditentukan'
                                    }
                                />
                                <Detail
                                    label="Tanggal mulai"
                                    value={formatDate(process.started_at)}
                                />
                                <Detail
                                    label="Target selesai"
                                    value={formatDate(
                                        process.estimated_completion_date,
                                    )}
                                />
                                <Detail
                                    label="Biro jasa / petugas luar"
                                    value={
                                        process.processor_name ??
                                        'Tidak menggunakan pihak luar'
                                    }
                                />
                                {process.origin_region && (
                                    <Detail
                                        label="Daerah asal"
                                        value={process.origin_region}
                                    />
                                )}
                                {process.destination_region && (
                                    <Detail
                                        label="Daerah tujuan"
                                        value={process.destination_region}
                                    />
                                )}
                                {process.target_owner_name && (
                                    <Detail
                                        label="Pemilik tujuan"
                                        value={process.target_owner_name}
                                    />
                                )}
                                {process.notes && (
                                    <div className="grid gap-0.5 sm:col-span-2 lg:col-span-3">
                                        <span className="text-xs font-medium text-muted-foreground">
                                            Catatan awal
                                        </span>
                                        <p className="text-sm whitespace-pre-wrap">
                                            {process.notes}
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="gap-0 overflow-hidden py-0">
                            <CardHeader className="border-b py-5">
                                <CardTitle>Dokumen Persyaratan</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader className="bg-muted/40">
                                            <TableRow>
                                                <TableHead>Dokumen</TableHead>
                                                <TableHead>
                                                    Status Fisik
                                                </TableHead>
                                                <TableHead>
                                                    Tanggal Diterima
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {process.items.map((item) => (
                                                <TableRow key={item.id}>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2 font-medium">
                                                            <FileTextIcon className="size-4 text-muted-foreground" />
                                                            {item.item_name}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline">
                                                            {custodyLabels[
                                                                item
                                                                    .custody_status
                                                            ] ??
                                                                item.custody_status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        {item.received_at
                                                            ? dateTimeFormatter.format(
                                                                  new Date(
                                                                      item.received_at,
                                                                  ),
                                                              )
                                                            : '—'}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Timeline Proses</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="relative space-y-6 before:absolute before:top-2 before:bottom-2 before:left-[0.6875rem] before:w-px before:bg-border">
                                    {process.events.map((event) => (
                                        <div
                                            key={event.id}
                                            className="relative grid grid-cols-[1.5rem_minmax(0,1fr)] gap-3"
                                        >
                                            <div className="z-10 flex size-6 items-center justify-center rounded-full border bg-background">
                                                <ClockCounterClockwiseIcon className="size-3.5" />
                                            </div>
                                            <div className="min-w-0 rounded-xl border p-4">
                                                <div className="flex flex-wrap items-center justify-between gap-2">
                                                    <Badge
                                                        variant="outline"
                                                        className={
                                                            statusClasses[
                                                                event.status
                                                            ]
                                                        }
                                                    >
                                                        {
                                                            statusOptions[
                                                                event.status
                                                            ]
                                                        }
                                                    </Badge>
                                                    <span className="text-xs text-muted-foreground">
                                                        {dateTimeFormatter.format(
                                                            new Date(
                                                                event.occurred_at,
                                                            ),
                                                        )}
                                                    </span>
                                                </div>
                                                <p className="mt-3 font-medium">
                                                    {event.description}
                                                </p>
                                                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                                    {event.location && (
                                                        <span className="inline-flex items-center gap-1">
                                                            <MapPinIcon />
                                                            {event.location}
                                                        </span>
                                                    )}
                                                    {event.creator && (
                                                        <span className="inline-flex items-center gap-1">
                                                            <UserIcon />
                                                            {event.creator.name}
                                                        </span>
                                                    )}
                                                    {event.recipient_name && (
                                                        <span className="inline-flex items-center gap-1">
                                                            <CheckCircleIcon />
                                                            Diterima{' '}
                                                            {
                                                                event.recipient_name
                                                            }
                                                        </span>
                                                    )}
                                                </div>
                                                {event.notes && (
                                                    <p className="mt-3 text-sm whitespace-pre-wrap text-muted-foreground">
                                                        {event.notes}
                                                    </p>
                                                )}
                                                {event.files.length > 0 && (
                                                    <div className="mt-3 flex flex-wrap gap-2">
                                                        {event.files.map(
                                                            (file) => (
                                                                <Button
                                                                    key={
                                                                        file.id
                                                                    }
                                                                    variant="outline"
                                                                    size="sm"
                                                                    asChild
                                                                >
                                                                    <a
                                                                        href={DocumentProcessController.downloadFile.url(
                                                                            file.id,
                                                                        )}
                                                                    >
                                                                        <FileArrowDownIcon />
                                                                        {
                                                                            file.file_name
                                                                        }
                                                                    </a>
                                                                </Button>
                                                            ),
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid h-fit gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Ringkasan Biaya</CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-4">
                                <div className="rounded-xl bg-muted/50 p-4">
                                    <span className="text-xs text-muted-foreground">
                                        Total seluruh biaya
                                    </span>
                                    <p className="mt-1 text-xl font-bold">
                                        {currencyFormatter.format(
                                            process.total_cost,
                                        )}
                                    </p>
                                </div>
                                <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
                                    <span className="text-xs text-muted-foreground">
                                        Masuk modal kendaraan
                                    </span>
                                    <p className="mt-1 text-xl font-bold text-amber-700 dark:text-amber-300">
                                        {currencyFormatter.format(
                                            process.capitalized_cost,
                                        )}
                                    </p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Hanya biaya yang dibayar showroom.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="gap-0 overflow-hidden py-0">
                            <CardHeader className="border-b py-5">
                                <CardTitle>Rincian Biaya</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                {process.costs.length === 0 ? (
                                    <p className="p-6 text-center text-sm text-muted-foreground">
                                        Belum ada biaya proses.
                                    </p>
                                ) : (
                                    <div className="divide-y">
                                        {process.costs.map((cost) => (
                                            <div
                                                key={cost.id}
                                                className="grid gap-2 p-4"
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <p className="text-sm font-semibold">
                                                        {cost.description}
                                                    </p>
                                                    <p className="shrink-0 text-sm font-bold">
                                                        {currencyFormatter.format(
                                                            cost.amount,
                                                        )}
                                                    </p>
                                                </div>
                                                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                                                    <span className="inline-flex items-center gap-1">
                                                        <CalendarDotsIcon />
                                                        {formatDate(
                                                            cost.paid_at,
                                                        )}
                                                    </span>
                                                    <Badge
                                                        variant={
                                                            cost.paid_by ===
                                                            'showroom'
                                                                ? 'default'
                                                                : 'secondary'
                                                        }
                                                    >
                                                        {cost.paid_by ===
                                                        'showroom'
                                                            ? 'Showroom · modal'
                                                            : 'Customer'}
                                                    </Badge>
                                                </div>
                                                {cost.receipt && (
                                                    <Button
                                                        variant="link"
                                                        size="sm"
                                                        className="h-auto w-fit p-0"
                                                        asChild
                                                    >
                                                        <a
                                                            href={DocumentProcessController.downloadFile.url(
                                                                cost.receipt.id,
                                                            )}
                                                        >
                                                            <FileArrowDownIcon />
                                                            Unduh bukti
                                                        </a>
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            <ProcessEventDialog
                open={isEventOpen}
                onOpenChange={setIsEventOpen}
                process={process}
                statusOptions={statusOptions}
            />
            <ProcessCostDialog
                open={isCostOpen}
                onOpenChange={setIsCostOpen}
                process={process}
            />
        </>
    );
}

DocumentProcessShow.layout = {
    breadcrumbs: [
        {
            title: 'Proses Berkas',
            href: DocumentProcessController.index.url(),
        },
        {
            title: 'Detail Proses',
            href: '#',
        },
    ],
};

import { Head } from '@inertiajs/react';
import {
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
import { DetailItem } from '@/components/detail-item';
import { PageContainer } from '@/components/page-container';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
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
import {
    formatCurrency,
    formatDate as formatCalendarDate,
    formatDateTime,
} from '@/lib/formatters';
import { ProcessCostDialog } from '@/pages/document-processes/process-cost-dialog';
import { ProcessEventDialog } from '@/pages/document-processes/process-event-dialog';
import { ProcessStatusBadge } from '@/pages/document-processes/process-status-badge';
import type {
    DocumentProcess,
    LabelOptions,
} from '@/pages/document-processes/types';

type Props = {
    process: DocumentProcess;
    type_options: LabelOptions;
    status_options: LabelOptions;
};

const custodyLabels: Record<string, string> = {
    waiting: 'Belum diterima',
    received: 'Diterima showroom',
    submitted: 'Diserahkan ke pengurus',
    returned: 'Dikembalikan',
    missing: 'Bermasalah / hilang',
};

function formatProcessDate(value: string | null): string {
    return formatCalendarDate(value?.slice(0, 10), {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        fallback: 'Belum ditentukan',
    });
}

export default function DocumentProcessShow({
    process,
    type_options: typeOptions,
    status_options: statusOptions,
}: Props) {
    const [isEventOpen, setIsEventOpen] = useState(false);
    const [isCostOpen, setIsCostOpen] = useState(false);
    const isTerminal = ['completed', 'cancelled'].includes(process.status);
    const carName = [process.car.brand?.name, process.car.name]
        .filter(Boolean)
        .join(' ');

    return (
        <>
            <Head title={`Proses ${process.process_number}`} />

            <PageContainer>
                <PageHeader
                    backHref={DocumentProcessController.index.url()}
                    backLabel="Kembali ke proses berkas"
                    title={process.process_number}
                    titleClassName="font-mono text-xl md:text-2xl"
                    titleAddon={
                        <ProcessStatusBadge
                            status={process.status}
                            labels={statusOptions}
                        />
                    }
                    description={
                        <>
                            {carName} ·{' '}
                            {process.car.license_plate ?? 'Tanpa plat'}
                        </>
                    }
                    actions={
                        <>
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
                        </>
                    }
                />

                <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(20rem,0.8fr)]">
                    <div className="grid min-w-0 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Informasi Proses</CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                                <DetailItem
                                    label="Jenis proses"
                                    value={
                                        typeOptions[process.process_type] ??
                                        process.process_type
                                    }
                                />
                                <DetailItem
                                    label="Kendaraan"
                                    value={`${carName} · ${process.car.license_plate ?? 'Tanpa plat'}`}
                                />
                                <DetailItem
                                    label="Customer"
                                    value={
                                        process.customer?.name ??
                                        'Proses internal showroom'
                                    }
                                />
                                <DetailItem
                                    label="Penanggung jawab"
                                    value={
                                        process.assignee?.name ??
                                        'Belum ditentukan'
                                    }
                                />
                                <DetailItem
                                    label="Tanggal mulai"
                                    value={formatProcessDate(
                                        process.started_at,
                                    )}
                                />
                                <DetailItem
                                    label="Target selesai"
                                    value={formatProcessDate(
                                        process.estimated_completion_date,
                                    )}
                                />
                                <DetailItem
                                    label="Biro jasa / petugas luar"
                                    value={
                                        process.processor_name ??
                                        'Tidak menggunakan pihak luar'
                                    }
                                />
                                {process.processor_phone && (
                                    <DetailItem
                                        label="Nomor kontak biro jasa"
                                        value={process.processor_phone}
                                        copyable
                                    />
                                )}
                                {process.origin_region && (
                                    <DetailItem
                                        label="Daerah asal"
                                        value={process.origin_region}
                                    />
                                )}
                                {process.destination_region && (
                                    <DetailItem
                                        label="Daerah tujuan"
                                        value={process.destination_region}
                                    />
                                )}
                                {process.target_owner_name && (
                                    <DetailItem
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
                                                        <StatusBadge
                                                            status={
                                                                item.custody_status
                                                            }
                                                            label={
                                                                custodyLabels[
                                                                    item
                                                                        .custody_status
                                                                ]
                                                            }
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        {item.received_at
                                                            ? formatDateTime(
                                                                  item.received_at,
                                                                  {
                                                                      day: '2-digit',
                                                                      month: 'short',
                                                                      year: 'numeric',
                                                                      hour: '2-digit',
                                                                      minute: '2-digit',
                                                                      timeZoneName:
                                                                          'short',
                                                                  },
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
                                                    <ProcessStatusBadge
                                                        status={event.status}
                                                        labels={statusOptions}
                                                    />
                                                    <span className="text-xs text-muted-foreground">
                                                        {formatDateTime(
                                                            event.occurred_at,
                                                            {
                                                                day: '2-digit',
                                                                month: 'short',
                                                                year: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                                timeZoneName:
                                                                    'short',
                                                            },
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
                                        {formatCurrency(process.total_cost)}
                                    </p>
                                </div>
                                <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
                                    <span className="text-xs text-muted-foreground">
                                        Masuk modal kendaraan
                                    </span>
                                    <p className="mt-1 text-xl font-bold text-amber-700 dark:text-amber-300">
                                        {formatCurrency(
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
                                                        {formatCurrency(
                                                            cost.amount,
                                                        )}
                                                    </p>
                                                </div>
                                                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                                                    <span className="inline-flex items-center gap-1">
                                                        <CalendarDotsIcon />
                                                        {formatProcessDate(
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
            </PageContainer>

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
        },
    ],
};

import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeftIcon,
    CalendarBlankIcon,
    CarProfileIcon,
    ClipboardTextIcon,
    CoinsIcon,
    DownloadSimpleIcon,
    FileTextIcon,
    GasPumpIcon,
    GaugeIcon,
    MoneyIcon,
    PencilSimpleIcon,
    TagIcon,
} from '@phosphor-icons/react';
import { useState } from 'react';
import CarController from '@/actions/App/Http/Controllers/CarController';
import DocumentProcessController from '@/actions/App/Http/Controllers/DocumentProcessController';
import VehicleDocumentController from '@/actions/App/Http/Controllers/VehicleDocumentController';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { CarStatusDialog } from '@/pages/cars/car-status-dialog';
import { formatFuel, formatTransmission } from '@/pages/cars/table-config';
import type {
    Car,
    VehicleDocument,
    VehicleDocumentType,
} from '@/pages/cars/types';
import {
    countCompleteRequiredDocuments,
    formatFileSize,
    getCarDocumentState,
    getDocumentStatusLabel,
    getEffectiveDocumentStatus,
    requiredDocumentTypes,
} from '@/pages/cars/vehicle-document-utils';
import { VehicleDocumentsDialog } from '@/pages/cars/vehicle-documents-dialog';
import { index as carsIndex } from '@/routes/cars';

type Props = {
    car: Car;
};

const currencyFormatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat('id-ID');

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
});

const dateTimeFormatter = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
});

function formatDate(value: string | null): string {
    if (!value) {
        return '—';
    }

    return dateFormatter.format(new Date(`${value.slice(0, 10)}T00:00:00`));
}

function findDocument(
    documents: VehicleDocument[],
    type: VehicleDocumentType,
): VehicleDocument | undefined {
    return documents.find((document) => document.document_type === type);
}

function DetailItem({ label, value }: { label: string; value: string }) {
    return (
        <div className="space-y-1">
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className="text-sm font-semibold break-words text-foreground">
                {value}
            </div>
        </div>
    );
}

function DocumentCard({
    title,
    document,
    children,
}: {
    title: string;
    document?: VehicleDocument;
    children?: React.ReactNode;
}) {
    return (
        <div className="space-y-3 rounded-xl border bg-background p-4">
            <div className="flex items-center justify-between gap-3">
                <div className="font-semibold">{title}</div>
                {document ? (
                    <StatusBadge
                        status={getEffectiveDocumentStatus(document)}
                        label={
                            getEffectiveDocumentStatus(document) === 'expired'
                                ? 'Kedaluwarsa'
                                : getDocumentStatusLabel(
                                      document.document_type,
                                      document.status,
                                  )
                        }
                    />
                ) : (
                    <StatusBadge status="incomplete" label="Belum diisi" />
                )}
            </div>
            {children && (
                <div className="grid gap-3 border-t pt-3 sm:grid-cols-2">
                    {children}
                </div>
            )}
        </div>
    );
}

export default function CarsShow({ car }: Props) {
    const [isStatusOpen, setIsStatusOpen] = useState(false);
    const [isDocumentsOpen, setIsDocumentsOpen] = useState(false);
    const documents = car.documents ?? [];
    const stnk = findDocument(documents, 'stnk');
    const bpkb = findDocument(documents, 'bpkb');
    const invoice = findDocument(documents, 'invoice');
    const documentState = getCarDocumentState(documents);
    const completeDocuments = countCompleteRequiredDocuments(documents);
    const estimatedMargin = car.capital
        ? car.selling_price - car.capital.total_capital
        : null;
    const attachmentSize = car.document_attachment
        ? formatFileSize(car.document_attachment.file_size)
        : null;

    return (
        <>
            <Head title={`Detail ${car.name}`} />

            <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-start gap-3">
                        <Button variant="outline" size="icon" asChild>
                            <Link
                                href={carsIndex()}
                                aria-label="Kembali ke mobil"
                            >
                                <ArrowLeftIcon />
                            </Link>
                        </Button>
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="text-2xl font-semibold tracking-tight">
                                    {car.name}
                                </h1>
                                <StatusBadge status={car.status} />
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {car.brand?.name ?? 'Merek belum tersedia'} ·{' '}
                                Tahun {car.year}
                                {car.license_plate
                                    ? ` · ${car.license_plate}`
                                    : ''}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="outline" asChild>
                            <Link
                                href={DocumentProcessController.create.url({
                                    query: { car_id: car.id },
                                })}
                            >
                                <ClipboardTextIcon />
                                Proses berkas
                            </Link>
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsStatusOpen(true)}
                        >
                            <TagIcon />
                            Ubah status
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsDocumentsOpen(true)}
                        >
                            <FileTextIcon />
                            Kelola dokumen
                        </Button>
                        <Button asChild>
                            <Link href={CarController.edit(car.id)}>
                                <PencilSimpleIcon />
                                Edit mobil
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.85fr)]">
                    <div className="space-y-6">
                        <Card className="overflow-hidden border-primary/20 p-0">
                            <div className="border-b bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6">
                                <div className="flex items-center gap-4">
                                    <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                                        <CarProfileIcon
                                            className="size-7"
                                            weight="fill"
                                        />
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-muted-foreground">
                                            Unit inventaris #{car.id}
                                        </div>
                                        <div className="mt-1 text-xl font-bold">
                                            {car.brand?.name} {car.name}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <CardContent className="grid gap-4 p-6 sm:grid-cols-3">
                                <div className="rounded-xl border bg-card p-4">
                                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                        <MoneyIcon className="size-4 text-emerald-600" />
                                        Harga jual
                                    </div>
                                    <div className="mt-2 text-lg font-bold text-emerald-600 dark:text-emerald-500">
                                        {currencyFormatter.format(
                                            car.selling_price,
                                        )}
                                    </div>
                                </div>
                                <div className="rounded-xl border bg-card p-4">
                                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                        <CoinsIcon className="size-4" />
                                        Total modal
                                    </div>
                                    <div className="mt-2 text-lg font-bold">
                                        {car.capital
                                            ? currencyFormatter.format(
                                                  car.capital.total_capital,
                                              )
                                            : '—'}
                                    </div>
                                </div>
                                <div className="rounded-xl border bg-card p-4">
                                    <div className="text-xs font-medium text-muted-foreground">
                                        Estimasi margin
                                    </div>
                                    <div
                                        className={`mt-2 text-lg font-bold ${
                                            estimatedMargin !== null &&
                                            estimatedMargin < 0
                                                ? 'text-rose-600'
                                                : 'text-blue-600 dark:text-blue-500'
                                        }`}
                                    >
                                        {estimatedMargin === null
                                            ? '—'
                                            : currencyFormatter.format(
                                                  estimatedMargin,
                                              )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Spesifikasi dan kondisi</CardTitle>
                                <CardDescription>
                                    Informasi identitas dan kondisi unit mobil.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-x-6 gap-y-5 sm:grid-cols-2 xl:grid-cols-3">
                                <DetailItem
                                    label="Transmisi"
                                    value={formatTransmission(car.transmission)}
                                />
                                <div className="space-y-1">
                                    <div className="text-xs text-muted-foreground">
                                        Bahan bakar
                                    </div>
                                    <div className="flex items-center gap-1.5 text-sm font-semibold">
                                        <GasPumpIcon className="size-4 text-muted-foreground" />
                                        {formatFuel(car.fuel_type)}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-xs text-muted-foreground">
                                        Jarak tempuh
                                    </div>
                                    <div className="flex items-center gap-1.5 text-sm font-semibold">
                                        <GaugeIcon className="size-4 text-muted-foreground" />
                                        {numberFormatter.format(car.mileage)} km
                                    </div>
                                </div>
                                <DetailItem
                                    label="Warna"
                                    value={car.color || '—'}
                                />
                                <DetailItem
                                    label="Plat nomor"
                                    value={car.license_plate || '—'}
                                />
                                <DetailItem
                                    label="Tahun pembuatan"
                                    value={String(car.year)}
                                />
                                <DetailItem
                                    label="Nomor rangka (VIN)"
                                    value={car.chassis_number || '—'}
                                />
                                <DetailItem
                                    label="Nomor mesin"
                                    value={car.engine_number || '—'}
                                />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex-row items-start justify-between gap-4">
                                <div className="space-y-1.5">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <CardTitle>Dokumen kendaraan</CardTitle>
                                        <StatusBadge status={documentState} />
                                    </div>
                                    <CardDescription>
                                        {completeDocuments}/
                                        {requiredDocumentTypes.length} dokumen
                                        inti siap digunakan.
                                    </CardDescription>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsDocumentsOpen(true)}
                                >
                                    Kelola
                                </Button>
                            </CardHeader>
                            <CardContent className="grid gap-4 xl:grid-cols-3">
                                <DocumentCard title="STNK" document={stnk}>
                                    <DetailItem
                                        label="Nama pemilik"
                                        value={stnk?.owner_name || '—'}
                                    />
                                    <DetailItem
                                        label="Tanggal terbit"
                                        value={formatDate(
                                            stnk?.issued_at ?? null,
                                        )}
                                    />
                                    <DetailItem
                                        label="Berlaku sampai"
                                        value={formatDate(
                                            stnk?.expires_at ?? null,
                                        )}
                                    />
                                </DocumentCard>
                                <DocumentCard title="BPKB" document={bpkb}>
                                    <DetailItem
                                        label="Nama pemilik"
                                        value={bpkb?.owner_name || '—'}
                                    />
                                    <DetailItem
                                        label="Tanggal terbit"
                                        value={formatDate(
                                            bpkb?.issued_at ?? null,
                                        )}
                                    />
                                </DocumentCard>
                                <DocumentCard
                                    title="Faktur kendaraan"
                                    document={invoice}
                                />

                                <div className="rounded-xl border border-dashed bg-muted/20 p-4 xl:col-span-3">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="flex min-w-0 items-center gap-3">
                                            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                                <FileTextIcon className="size-5" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-xs text-muted-foreground">
                                                    Lampiran bersama
                                                </div>
                                                <div className="truncate text-sm font-semibold">
                                                    {car.document_attachment
                                                        ?.file_name ??
                                                        'Belum ada file lampiran'}
                                                </div>
                                                {attachmentSize && (
                                                    <div className="text-xs text-muted-foreground">
                                                        {attachmentSize}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        {car.document_attachment?.file_name && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                asChild
                                            >
                                                <a
                                                    href={VehicleDocumentController.download.url(
                                                        car.id,
                                                    )}
                                                >
                                                    <DownloadSimpleIcon />
                                                    Unduh file
                                                </a>
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {car.description && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Catatan kendaraan</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
                                        {car.description}
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between gap-3">
                                    <CardTitle>Modal mobil</CardTitle>
                                    {car.capital && (
                                        <StatusBadge
                                            status={car.capital.status}
                                            label={
                                                car.capital.status ===
                                                'completed'
                                                    ? 'Aktif'
                                                    : car.capital.status ===
                                                        'draft'
                                                      ? 'Draft'
                                                      : 'Dibatalkan'
                                            }
                                        />
                                    )}
                                </div>
                                <CardDescription>
                                    Rincian biaya perolehan unit.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                {car.capital ? (
                                    <>
                                        <div className="flex justify-between gap-4">
                                            <span className="text-muted-foreground">
                                                Harga beli
                                            </span>
                                            <span className="font-medium">
                                                {currencyFormatter.format(
                                                    car.capital.price,
                                                )}
                                            </span>
                                        </div>
                                        <div className="flex justify-between gap-4">
                                            <span className="text-muted-foreground">
                                                Biaya perbaikan
                                            </span>
                                            <span className="font-medium">
                                                {currencyFormatter.format(
                                                    car.capital.repair_cost,
                                                )}
                                            </span>
                                        </div>
                                        <div className="flex justify-between gap-4">
                                            <span className="text-muted-foreground">
                                                Biaya transportasi
                                            </span>
                                            <span className="font-medium">
                                                {currencyFormatter.format(
                                                    car.capital.transport_cost,
                                                )}
                                            </span>
                                        </div>
                                        <div className="flex justify-between gap-4">
                                            <span className="text-muted-foreground">
                                                Biaya lainnya
                                            </span>
                                            <span className="font-medium">
                                                {currencyFormatter.format(
                                                    car.capital.other_cost,
                                                )}
                                            </span>
                                        </div>
                                        <div className="flex justify-between gap-4">
                                            <span className="text-muted-foreground">
                                                Proses berkas
                                            </span>
                                            <span className="font-medium">
                                                {currencyFormatter.format(
                                                    car.capital
                                                        .document_process_cost,
                                                )}
                                            </span>
                                        </div>
                                        <div className="flex justify-between gap-4 border-t pt-3 font-semibold">
                                            <span>Total modal</span>
                                            <span>
                                                {currencyFormatter.format(
                                                    car.capital.total_capital,
                                                )}
                                            </span>
                                        </div>
                                        <div className="space-y-1 border-t pt-3 text-xs text-muted-foreground">
                                            <div>
                                                Nomor:{' '}
                                                <span className="font-mono font-medium text-foreground">
                                                    {
                                                        car.capital
                                                            .purchase_number
                                                    }
                                                </span>
                                            </div>
                                            <div>
                                                Tanggal:{' '}
                                                <span className="font-medium text-foreground">
                                                    {formatDate(
                                                        car.capital
                                                            .purchase_date,
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        Data modal belum tersedia untuk mobil
                                        ini.
                                    </p>
                                )}
                                <Button
                                    variant="outline"
                                    className="mt-2 w-full"
                                    asChild
                                >
                                    <Link href={CarController.edit(car.id)}>
                                        <CoinsIcon />
                                        {car.capital
                                            ? 'Kelola modal'
                                            : 'Lengkapi modal'}
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Informasi pencatatan</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <CalendarBlankIcon className="mt-0.5 size-4 text-muted-foreground" />
                                    <div>
                                        <div className="text-xs text-muted-foreground">
                                            Diinput pada
                                        </div>
                                        <div className="mt-0.5 text-sm font-medium">
                                            {dateTimeFormatter.format(
                                                new Date(car.created_at),
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                                    Data spesifikasi, modal, status, dan dokumen
                                    unit dapat dikelola dari halaman ini.
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            <CarStatusDialog
                car={isStatusOpen ? car : null}
                onOpenChange={setIsStatusOpen}
            />
            <VehicleDocumentsDialog
                car={isDocumentsOpen ? car : null}
                onOpenChange={setIsDocumentsOpen}
            />
        </>
    );
}

CarsShow.layout = {
    breadcrumbs: [
        {
            title: 'Mobil',
            href: carsIndex.url(),
        },
        {
            title: 'Detail Mobil',
            href: '#',
        },
    ],
};

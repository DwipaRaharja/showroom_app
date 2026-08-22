import { Link } from '@inertiajs/react';
import {
    CalendarBlankIcon,
    CarProfileIcon,
    FileTextIcon,
    GasPumpIcon,
    GaugeIcon,
    MoneyIcon,
    PencilSimpleIcon,
    TagIcon,
} from '@phosphor-icons/react';
import CarController from '@/actions/App/Http/Controllers/CarController';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
} from '@/components/ui/dialog';
import { formatFuel, formatTransmission } from '@/pages/cars/table-config';
import type { Car } from '@/pages/cars/types';
import {
    countCompleteRequiredDocuments,
    getCarDocumentState,
    requiredDocumentTypes,
} from '@/pages/cars/vehicle-document-utils';

type Props = {
    car: Car | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onStatusChange?: (car: Car) => void;
    onManageDocuments?: (car: Car) => void;
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
    hour: '2-digit',
    minute: '2-digit',
});

export function CarDetailDialog({
    car,
    open,
    onOpenChange,
    onStatusChange,
    onManageDocuments,
}: Props) {
    if (!car) {
        return null;
    }

    const estimatedMargin =
        car.purchase_price !== null
            ? car.selling_price - car.purchase_price
            : null;
    const documentState = getCarDocumentState(car.documents ?? []);
    const completeDocuments = countCompleteRequiredDocuments(
        car.documents ?? [],
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] gap-0 overflow-y-auto p-0 sm:max-w-xl">
                {/* Header Banner */}
                <div className="border-b bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 pr-14">
                    <div className="flex items-center gap-3.5">
                        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary text-base font-semibold text-primary-foreground shadow-sm">
                            <CarProfileIcon className="size-6" weight="fill" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <DialogTitle className="text-xl font-bold tracking-tight">
                                    {car.name}
                                </DialogTitle>
                                <StatusBadge
                                    status={car.status}
                                    className="px-2 py-0.5 text-xs shadow-xs"
                                />
                            </div>
                            <DialogDescription className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                                <span className="font-medium text-foreground">
                                    {car.brand?.name ?? 'Merek'}
                                </span>
                                <span>•</span>
                                <span>Tahun {car.year}</span>
                                {car.license_plate && (
                                    <>
                                        <span>•</span>
                                        <span className="font-mono font-medium text-foreground">
                                            {car.license_plate}
                                        </span>
                                    </>
                                )}
                            </DialogDescription>
                        </div>
                    </div>
                </div>

                {/* Body Details */}
                <div className="space-y-4 p-6 text-sm">
                    {/* Pricing Cards Grid */}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="rounded-xl border bg-card p-3.5 shadow-xs">
                            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                                <MoneyIcon className="size-4 text-emerald-600 dark:text-emerald-500" />
                                Harga Jual Showroom
                            </div>
                            <div className="mt-1 text-lg font-bold text-emerald-600 dark:text-emerald-500">
                                {currencyFormatter.format(car.selling_price)}
                            </div>
                        </div>

                        <div className="rounded-xl border bg-card p-3.5 shadow-xs">
                            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                                <TagIcon className="size-4 text-muted-foreground" />
                                Harga Modal / Beli
                            </div>
                            <div className="mt-1 text-lg font-semibold text-foreground">
                                {car.purchase_price !== null
                                    ? currencyFormatter.format(
                                          car.purchase_price,
                                      )
                                    : '—'}
                            </div>
                            {estimatedMargin !== null && (
                                <div className="mt-0.5 text-xs text-muted-foreground">
                                    Est. Margin:{' '}
                                    <span
                                        className={
                                            estimatedMargin >= 0
                                                ? 'font-medium text-emerald-600'
                                                : 'font-medium text-rose-600'
                                        }
                                    >
                                        {currencyFormatter.format(
                                            estimatedMargin,
                                        )}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Specifications Grid */}
                    <div className="space-y-3 rounded-xl border bg-card p-4 shadow-xs">
                        <div className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                            Spesifikasi & Kondisi
                        </div>
                        <div className="grid grid-cols-2 gap-3 pt-1 sm:grid-cols-3">
                            <div>
                                <div className="text-xs text-muted-foreground">
                                    Transmisi
                                </div>
                                <div className="mt-0.5 font-semibold text-foreground">
                                    {formatTransmission(car.transmission)}
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-muted-foreground">
                                    Bahan Bakar
                                </div>
                                <div className="mt-0.5 flex items-center gap-1 font-semibold text-foreground">
                                    <GasPumpIcon className="size-4 text-muted-foreground" />
                                    {formatFuel(car.fuel_type)}
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-muted-foreground">
                                    Jarak Tempuh
                                </div>
                                <div className="mt-0.5 flex items-center gap-1 font-semibold text-foreground">
                                    <GaugeIcon className="size-4 text-muted-foreground" />
                                    {numberFormatter.format(car.mileage)} km
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-muted-foreground">
                                    Warna
                                </div>
                                <div className="mt-0.5 font-semibold text-foreground">
                                    {car.color || '—'}
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-muted-foreground">
                                    Plat Nomor
                                </div>
                                <div className="mt-0.5 font-mono font-semibold text-foreground">
                                    {car.license_plate || '—'}
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-muted-foreground">
                                    Tahun Pembuatan
                                </div>
                                <div className="mt-0.5 font-semibold text-foreground">
                                    {car.year}
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-muted-foreground">
                                    No. Rangka (VIN)
                                </div>
                                <div className="mt-0.5 font-mono text-xs font-semibold text-foreground">
                                    {car.chassis_number || '—'}
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-muted-foreground">
                                    No. Mesin
                                </div>
                                <div className="mt-0.5 font-mono text-xs font-semibold text-foreground">
                                    {car.engine_number || '—'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Vehicle Documents */}
                    <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-3">
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <FileTextIcon
                                    className="size-5"
                                    weight="fill"
                                />
                            </div>
                            <div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-sm font-semibold">
                                        Surat & dokumen
                                    </span>
                                    <StatusBadge status={documentState} />
                                </div>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {completeDocuments}/
                                    {requiredDocumentTypes.length} dokumen inti
                                    lengkap
                                </p>
                            </div>
                        </div>
                        {onManageDocuments && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    onOpenChange(false);
                                    onManageDocuments(car);
                                }}
                            >
                                Kelola dokumen
                            </Button>
                        )}
                    </div>

                    {/* Description / Notes */}
                    {car.description && (
                        <div className="rounded-xl border bg-card p-4 shadow-xs">
                            <div className="mb-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                Catatan & Riwayat Kendaraan
                            </div>
                            <p className="text-sm leading-relaxed text-muted-foreground">
                                {car.description}
                            </p>
                        </div>
                    )}

                    {/* Registration Date */}
                    <div className="flex items-center gap-2 px-1 text-xs text-muted-foreground">
                        <CalendarBlankIcon className="size-4" />
                        <span>
                            Diinput pada{' '}
                            <strong className="font-medium text-foreground">
                                {dateFormatter.format(new Date(car.created_at))}
                            </strong>
                        </span>
                    </div>
                </div>

                {/* Footer Actions */}
                <DialogFooter className="gap-2 border-t bg-muted/30 p-4 sm:gap-2">
                    {onStatusChange && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                onOpenChange(false);
                                onStatusChange(car);
                            }}
                            className="gap-1.5"
                        >
                            <TagIcon className="size-4" />
                            Ubah status
                        </Button>
                    )}
                    <Button
                        type="button"
                        variant="outline"
                        className="gap-1.5"
                        asChild
                    >
                        <Link href={CarController.edit(car.id)}>
                            <PencilSimpleIcon className="size-4" />
                            Edit unit
                        </Link>
                    </Button>
                    <DialogClose asChild>
                        <Button type="button" className="min-w-20">
                            Tutup
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

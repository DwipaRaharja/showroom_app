import { Link } from '@inertiajs/react';
import {
    CalendarBlankIcon,
    CarProfileIcon,
    CoinsIcon,
    PencilSimpleIcon,
    TagIcon,
} from '@phosphor-icons/react';
import PurchaseController from '@/actions/App/Http/Controllers/PurchaseController';
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
import { formatCapitalStatus } from '@/pages/purchases/table-config';
import type { Purchase } from '@/pages/purchases/types';

type Props = {
    purchase: Purchase | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onStatusChange: (purchase: Purchase) => void;
};

const currencyFormatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
});

const costItems: {
    key: keyof Pick<
        Purchase,
        'price' | 'repair_cost' | 'transport_cost' | 'other_cost'
    >;
    label: string;
}[] = [
    { key: 'price', label: 'Harga perolehan' },
    { key: 'repair_cost', label: 'Perbaikan / rekondisi' },
    { key: 'transport_cost', label: 'Transportasi' },
    { key: 'other_cost', label: 'Biaya lainnya' },
];

export function PurchaseDetailDialog({
    purchase,
    open,
    onOpenChange,
    onStatusChange,
}: Props) {
    if (!purchase) {
        return null;
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] gap-0 overflow-y-auto p-0 sm:max-w-xl">
                <div className="border-b bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 pr-14">
                    <div className="flex items-center gap-3.5">
                        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                            <CoinsIcon className="size-6" weight="fill" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <DialogTitle className="font-mono text-lg font-bold tracking-tight">
                                    {purchase.purchase_number}
                                </DialogTitle>
                                <StatusBadge
                                    status={purchase.status}
                                    label={formatCapitalStatus(purchase.status)}
                                />
                            </div>
                            <DialogDescription className="mt-1">
                                Rincian modal kendaraan showroom.
                            </DialogDescription>
                        </div>
                    </div>
                </div>

                <div className="space-y-4 p-6 text-sm">
                    <div className="rounded-xl border bg-card p-4 shadow-xs">
                        <div className="flex items-start gap-3">
                            <CarProfileIcon className="mt-0.5 size-5 text-primary" />
                            <div>
                                <div className="text-xs font-medium text-muted-foreground">
                                    Unit mobil
                                </div>
                                {purchase.car ? (
                                    <>
                                        <div className="mt-0.5 font-semibold">
                                            {purchase.car.brand?.name
                                                ? `${purchase.car.brand.name} `
                                                : ''}
                                            {purchase.car.name}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            Tahun {purchase.car.year}
                                            {purchase.car.license_plate
                                                ? ` · ${purchase.car.license_plate}`
                                                : ''}
                                        </div>
                                    </>
                                ) : (
                                    <div className="mt-0.5 text-muted-foreground">
                                        Data mobil telah dihapus
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                        <div className="text-xs font-medium text-muted-foreground">
                            Total modal kendaraan
                        </div>
                        <div className="mt-1 text-2xl font-bold text-primary tabular-nums">
                            {currencyFormatter.format(purchase.total_capital)}
                        </div>
                    </div>

                    <div className="divide-y rounded-xl border bg-card px-4 shadow-xs">
                        {costItems.map((item) => (
                            <div
                                key={item.key}
                                className="flex items-center justify-between gap-4 py-3"
                            >
                                <span className="text-muted-foreground">
                                    {item.label}
                                </span>
                                <strong className="text-right font-semibold tabular-nums">
                                    {currencyFormatter.format(
                                        purchase[item.key],
                                    )}
                                </strong>
                            </div>
                        ))}
                    </div>

                    <div className="flex items-start gap-2.5 rounded-xl border bg-card p-4 shadow-xs">
                        <CalendarBlankIcon className="mt-0.5 size-4 text-muted-foreground" />
                        <div>
                            <div className="text-xs text-muted-foreground">
                                Tanggal pencatatan
                            </div>
                            <div className="font-medium">
                                {dateFormatter.format(
                                    new Date(purchase.purchase_date),
                                )}
                            </div>
                        </div>
                    </div>

                    {purchase.notes && (
                        <div className="rounded-xl border bg-card p-4 shadow-xs">
                            <div className="mb-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                Catatan
                            </div>
                            <p className="leading-relaxed text-muted-foreground">
                                {purchase.notes}
                            </p>
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2 border-t bg-muted/30 p-4 sm:gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                            onOpenChange(false);
                            onStatusChange(purchase);
                        }}
                    >
                        <TagIcon />
                        Ubah status
                    </Button>
                    <Button type="button" variant="outline" asChild>
                        <Link href={PurchaseController.edit(purchase.id)}>
                            <PencilSimpleIcon />
                            Edit modal
                        </Link>
                    </Button>
                    <DialogClose asChild>
                        <Button type="button">Tutup</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

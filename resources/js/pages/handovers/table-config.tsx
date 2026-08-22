import { Link } from '@inertiajs/react';
import {
    CheckCircleIcon,
    DotsThreeVerticalIcon,
    EyeIcon,
    KeyIcon,
    PrinterIcon,
    ShieldCheckIcon,
    WarningCircleIcon,
    WhatsappLogoIcon,
} from '@phosphor-icons/react';
import {
    columnFilteringFeature,
    columnVisibilityFeature,
    createColumnHelper,
    createFilteredRowModel,
    createPaginatedRowModel,
    createSortedRowModel,
    filterFn_equals,
    filterFn_includesString,
    globalFilteringFeature,
    rowPaginationFeature,
    rowSelectionFeature,
    rowSortingFeature,
    sortFn_text,
    tableFeatures,
} from '@tanstack/react-table';
import VehicleHandoverController from '@/actions/App/Http/Controllers/VehicleHandoverController';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Sale } from '@/pages/sales/types';
import { show as salesShow } from '@/routes/sales';

export const handoverTableFeatures = tableFeatures({
    columnFilteringFeature,
    globalFilteringFeature,
    filteredRowModel: createFilteredRowModel(),
    filterFns: {
        equals: filterFn_equals,
        includesString: filterFn_includesString,
    },
    rowSortingFeature,
    sortedRowModel: createSortedRowModel(),
    sortFns: { text: sortFn_text },
    rowPaginationFeature,
    paginatedRowModel: createPaginatedRowModel(),
    rowSelectionFeature,
    columnVisibilityFeature,
});

const columnHelper = createColumnHelper<
    typeof handoverTableFeatures,
    Sale
>();

const currencyFormatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
});

export function createHandoverColumns(
    onManageHandover: (sale: Sale) => void,
) {
    return columnHelper.columns([
        columnHelper.accessor('invoice_number', {
            id: 'invoice_number',
            header: 'No. SPK & BAST',
            cell: ({ row }) => {
                const sale = row.original;
                const handover = sale.handover;

                return (
                    <div className="space-y-1">
                        <Link
                            href={salesShow(sale.id)}
                            className="font-mono text-xs font-bold text-primary hover:underline"
                        >
                            {sale.invoice_number}
                        </Link>
                        {handover ? (
                            <div className="font-mono text-[11px] text-muted-foreground">
                                {handover.handover_number}
                            </div>
                        ) : (
                            <div className="text-[11px] text-muted-foreground italic">
                                Belum Ada BAST
                            </div>
                        )}
                    </div>
                );
            },
        }),

        columnHelper.display({
            id: 'car',
            header: 'Unit Kendaraan',
            cell: ({ row }) => {
                const car = row.original.car;
                if (!car) return <span className="text-muted-foreground">—</span>;

                return (
                    <div className="space-y-0.5">
                        <div className="text-xs font-semibold text-foreground">
                            {car.brand?.name} {car.name}
                        </div>
                        <div className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
                            <span className="rounded bg-muted px-1.5 py-0.5 font-semibold text-foreground">
                                {car.license_plate ?? 'Tanpa Plat'}
                            </span>
                            <span>•</span>
                            <span>{car.year}</span>
                            <span>•</span>
                            <span className="capitalize">{car.color}</span>
                        </div>
                    </div>
                );
            },
        }),

        columnHelper.display({
            id: 'customer',
            header: 'Pembeli & Penerima',
            cell: ({ row }) => {
                const customer = row.original.customer;
                const handover = row.original.handover;

                return (
                    <div className="space-y-1 text-xs">
                        <div className="font-semibold text-foreground">
                            {customer?.name ?? '—'}
                        </div>
                        {customer?.phone && (
                            <div className="flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
                                <span>{customer.phone}</span>
                                <a
                                    href={`https://wa.me/${customer.phone.replace(/\D/g, '')}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-emerald-600 hover:text-emerald-700"
                                    aria-label="Kirim WhatsApp"
                                >
                                    <WhatsappLogoIcon className="size-3.5" />
                                </a>
                            </div>
                        )}
                        {handover && handover.recipient_name !== customer?.name && (
                            <div className="rounded bg-muted/60 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                Penerima: {handover.recipient_name} ({handover.recipient_relation})
                            </div>
                        )}
                    </div>
                );
            },
        }),

        columnHelper.display({
            id: 'financial',
            header: 'Status Pembayaran',
            cell: ({ row }) => {
                const sale = row.original;
                const remaining = sale.remaining_bill ?? 0;
                const totalPaid = sale.total_paid ?? 0;

                return (
                    <div className="space-y-0.5 text-xs">
                        <div className="font-semibold text-foreground">
                            {currencyFormatter.format(sale.deal_price)}
                        </div>
                        <div className="text-[11px] text-emerald-600 dark:text-emerald-400">
                            Masuk: {currencyFormatter.format(totalPaid)}
                        </div>
                        {remaining > 0 ? (
                            <div className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                                Sisa: {currencyFormatter.format(remaining)}
                            </div>
                        ) : (
                            <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                Lunas 100%
                            </div>
                        )}
                    </div>
                );
            },
        }),

        columnHelper.display({
            id: 'vehicle_status',
            header: 'Serah Unit & STNK',
            cell: ({ row }) => {
                const sale = row.original;
                const handover = sale.handover;
                const remaining = sale.remaining_bill ?? 0;
                const canDeliver = sale.can_deliver_vehicle ?? (remaining <= 10_000_000);

                if (handover?.vehicle_delivered_at) {
                    return (
                        <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                                <CheckCircleIcon className="size-3.5" weight="fill" />
                                Diserahkan
                            </span>
                            <div className="text-[10px] text-muted-foreground">
                                {dateFormatter.format(new Date(handover.vehicle_delivered_at))}
                            </div>
                        </div>
                    );
                }

                if (canDeliver) {
                    return (
                        <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                                <KeyIcon className="size-3.5" weight="bold" />
                                Siap Serah (≤ 10jt)
                            </span>
                            <div className="text-[10px] text-muted-foreground">
                                Menunggu serah terima
                            </div>
                        </div>
                    );
                }

                return (
                    <div className="space-y-0.5">
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[11px] font-semibold text-red-700 dark:text-red-300">
                            <WarningCircleIcon className="size-3.5" weight="bold" />
                            Terkunci (&gt; 10jt)
                        </span>
                        <div className="text-[10px] text-muted-foreground">
                            Belum penuhi syarat
                        </div>
                    </div>
                );
            },
        }),

        columnHelper.display({
            id: 'bpkb_status',
            header: 'Serah BPKB & Faktur',
            cell: ({ row }) => {
                const sale = row.original;
                const handover = sale.handover;
                const remaining = sale.remaining_bill ?? 0;
                const isSettled = remaining <= 0;

                if (handover?.bpkb_delivered_at) {
                    return (
                        <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                                <ShieldCheckIcon className="size-3.5" weight="fill" />
                                Diserahkan
                            </span>
                            <div className="text-[10px] text-muted-foreground">
                                {dateFormatter.format(new Date(handover.bpkb_delivered_at))}
                            </div>
                        </div>
                    );
                }

                if (isSettled) {
                    return (
                        <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-[11px] font-semibold text-blue-700 dark:text-blue-300">
                                <ShieldCheckIcon className="size-3.5" weight="bold" />
                                Siap Serah (Lunas)
                            </span>
                            <div className="text-[10px] text-muted-foreground">
                                Dapat diserahkan
                            </div>
                        </div>
                    );
                }

                return (
                    <div className="space-y-0.5">
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                            Ditahan di Showroom
                        </span>
                        <div className="text-[10px] text-muted-foreground">
                            Belum lunas 100%
                        </div>
                    </div>
                );
            },
        }),

        columnHelper.display({
            id: 'actions',
            header: 'Aksi',
            cell: ({ row }) => {
                const sale = row.original;

                return (
                    <div className="flex items-center gap-1">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs font-medium"
                            onClick={() => onManageHandover(sale)}
                        >
                            <KeyIcon className="mr-1 size-3.5" />
                            {sale.handover ? 'Perbarui BAST' : 'Catat Serah Terima'}
                        </Button>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="size-8">
                                    <DotsThreeVerticalIcon className="size-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                    <Link href={VehicleHandoverController.printBast.url(sale.id)}>
                                        <PrinterIcon className="mr-2 size-4" />
                                        Cetak Dokumen BAST
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link href={salesShow(sale.id)}>
                                        <EyeIcon className="mr-2 size-4" />
                                        Lihat Detail SPK
                                    </Link>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                );
            },
        }),
    ]);
}

import { Link } from '@inertiajs/react';
import {
    CaretDownIcon,
    CaretUpDownIcon,
    CaretUpIcon,
    CheckCircleIcon,
    DotsThreeVerticalIcon,
    EyeIcon,
    FileArrowDownIcon,
    KeyIcon,
    LockKeyIcon,
    PencilSimpleIcon,
    PrinterIcon,
    ShieldCheckIcon,
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Sale } from '@/pages/sales/types';
import { show as salesShow } from '@/routes/sales';

export type HandoverFilterStatus =
    'locked' | 'ready' | 'vehicle_delivered' | 'completed';

export const handoverStatusOptions: Array<{
    value: HandoverFilterStatus;
    label: string;
}> = [
    { value: 'locked', label: 'Menunggu pembayaran' },
    { value: 'ready', label: 'Siap diserahkan' },
    { value: 'vehicle_delivered', label: 'Unit sudah diserahkan' },
    { value: 'completed', label: 'Selesai lengkap' },
];

export const handoverColumnLabels: Record<string, string> = {
    transaction: 'Transaksi & unit',
    customer: 'Pembeli & penerima',
    payment: 'Pembayaran',
    handover_status: 'Progres penyerahan',
};

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

const columnHelper = createColumnHelper<typeof handoverTableFeatures, Sale>();

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

function getHandoverStatus(sale: Sale): HandoverFilterStatus {
    if (sale.handover?.bpkb_delivered_at) {
        return 'completed';
    }

    if (sale.handover?.vehicle_delivered_at) {
        return 'vehicle_delivered';
    }

    const remaining = sale.remaining_bill ?? sale.deal_price;
    const canDeliver = sale.can_deliver_vehicle ?? remaining <= 10_000_000;

    return canDeliver ? 'ready' : 'locked';
}

function SortableHeader({
    label,
    isSorted,
    onToggle,
}: {
    label: string;
    isSorted: false | 'asc' | 'desc';
    onToggle: ((event: unknown) => void) | undefined;
}) {
    return (
        <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8"
            onClick={onToggle}
            aria-label={`Urutkan berdasarkan ${label}`}
        >
            {label}
            {isSorted === 'asc' ? (
                <CaretUpIcon />
            ) : isSorted === 'desc' ? (
                <CaretDownIcon />
            ) : (
                <CaretUpDownIcon className="opacity-60" />
            )}
        </Button>
    );
}

function ProgressCell({ sale }: { sale: Sale }) {
    const handover = sale.handover;
    const status = getHandoverStatus(sale);

    const statusConfig = {
        locked: {
            label: 'Menunggu pembayaran',
            className:
                'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300',
            icon: LockKeyIcon,
        },
        ready: {
            label: 'Siap diserahkan',
            className:
                'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
            icon: KeyIcon,
        },
        vehicle_delivered: {
            label: 'Menunggu BPKB',
            className:
                'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
            icon: CheckCircleIcon,
        },
        completed: {
            label: 'Selesai lengkap',
            className:
                'border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300',
            icon: ShieldCheckIcon,
        },
    }[status];
    const StatusIcon = statusConfig.icon;

    return (
        <div className="min-w-52 space-y-1.5">
            <Badge variant="outline" className={statusConfig.className}>
                <StatusIcon />
                {statusConfig.label}
            </Badge>
            <div className="grid gap-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                    <KeyIcon className="size-3.5" />
                    <span>
                        Unit:{' '}
                        {handover?.vehicle_delivered_at
                            ? dateFormatter.format(
                                  new Date(handover.vehicle_delivered_at),
                              )
                            : status === 'locked'
                              ? 'belum memenuhi syarat'
                              : 'belum diserahkan'}
                    </span>
                </div>
                <div className="flex items-center gap-1.5">
                    <ShieldCheckIcon className="size-3.5" />
                    <span>
                        BPKB:{' '}
                        {handover?.bpkb_delivered_at
                            ? dateFormatter.format(
                                  new Date(handover.bpkb_delivered_at),
                              )
                            : (sale.remaining_bill ?? 0) > 0
                              ? 'ditahan sampai lunas'
                              : 'belum diserahkan'}
                    </span>
                </div>
            </div>
        </div>
    );
}

export function createHandoverColumns(onManageHandover: (sale: Sale) => void) {
    return columnHelper.columns([
        columnHelper.accessor((sale) => sale.id, {
            id: 'number',
            header: '#',
            enableHiding: false,
            cell: ({ row }) => (
                <span className="text-sm text-muted-foreground">
                    {row.index + 1}
                </span>
            ),
        }),
        columnHelper.accessor(
            (sale) =>
                [
                    sale.invoice_number,
                    sale.handover?.handover_number,
                    sale.car?.brand?.name,
                    sale.car?.name,
                    sale.car?.license_plate,
                ]
                    .filter(Boolean)
                    .join(' '),
            {
                id: 'transaction',
                header: ({ column }) => (
                    <SortableHeader
                        label="Transaksi & Unit"
                        isSorted={column.getIsSorted()}
                        onToggle={column.getToggleSortingHandler()}
                    />
                ),
                cell: ({ row }) => {
                    const sale = row.original;

                    return (
                        <div className="min-w-56">
                            <Link
                                href={salesShow(sale.id)}
                                className="block font-mono text-xs font-semibold text-primary hover:underline"
                            >
                                {sale.invoice_number}
                            </Link>
                            <div className="pt-0.5 font-semibold text-foreground">
                                {sale.car?.brand?.name} {sale.car?.name}
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-xs text-muted-foreground">
                                <span className="rounded bg-muted px-1.5 py-0.5 font-mono font-medium text-foreground">
                                    {sale.car?.license_plate ?? 'Tanpa plat'}
                                </span>
                                <span>•</span>
                                <span>{sale.car?.year}</span>
                                {sale.handover && (
                                    <>
                                        <span>•</span>
                                        <span className="font-mono">
                                            {sale.handover.handover_number}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                    );
                },
            },
        ),
        columnHelper.accessor(
            (sale) =>
                [
                    sale.customer?.name,
                    sale.customer?.phone,
                    sale.handover?.recipient_name,
                ]
                    .filter(Boolean)
                    .join(' '),
            {
                id: 'customer',
                header: ({ column }) => (
                    <SortableHeader
                        label="Pembeli & Penerima"
                        isSorted={column.getIsSorted()}
                        onToggle={column.getToggleSortingHandler()}
                    />
                ),
                cell: ({ row }) => {
                    const sale = row.original;
                    const recipientIsDifferent =
                        sale.handover &&
                        sale.handover.recipient_name !== sale.customer?.name;

                    return (
                        <div className="min-w-40">
                            <div className="font-semibold text-foreground">
                                {sale.customer?.name ?? '—'}
                            </div>
                            <div className="pt-0.5 text-xs text-muted-foreground">
                                {sale.customer?.phone ?? 'Tanpa nomor HP'}
                            </div>
                            {recipientIsDifferent && (
                                <div className="pt-0.5 text-xs text-muted-foreground">
                                    Penerima:{' '}
                                    <span className="font-medium text-foreground">
                                        {sale.handover?.recipient_name}
                                    </span>
                                </div>
                            )}
                        </div>
                    );
                },
            },
        ),
        columnHelper.accessor(
            (sale) => sale.remaining_bill ?? sale.deal_price,
            {
                id: 'payment',
                header: ({ column }) => (
                    <SortableHeader
                        label="Pembayaran"
                        isSorted={column.getIsSorted()}
                        onToggle={column.getToggleSortingHandler()}
                    />
                ),
                cell: ({ row }) => {
                    const sale = row.original;
                    const remaining = sale.remaining_bill ?? sale.deal_price;

                    return (
                        <div className="min-w-36 text-sm">
                            <div className="font-semibold text-foreground">
                                {currencyFormatter.format(sale.deal_price)}
                            </div>
                            {remaining > 0 ? (
                                <div className="pt-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                                    Sisa {currencyFormatter.format(remaining)}
                                </div>
                            ) : (
                                <div className="pt-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                    Lunas 100%
                                </div>
                            )}
                        </div>
                    );
                },
            },
        ),
        columnHelper.accessor(getHandoverStatus, {
            id: 'handover_status',
            header: 'Progres Penyerahan',
            filterFn: 'equals',
            enableSorting: false,
            cell: ({ row }) => <ProgressCell sale={row.original} />,
        }),
        columnHelper.display({
            id: 'actions',
            header: 'Aksi',
            enableHiding: false,
            enableSorting: false,
            cell: ({ row }) => {
                const sale = row.original;
                const status = getHandoverStatus(sale);
                const isLocked = status === 'locked' && !sale.handover;

                return (
                    <div className="flex items-center justify-end gap-1">
                        <Button
                            variant={sale.handover ? 'outline' : 'default'}
                            size="sm"
                            disabled={isLocked}
                            onClick={() => onManageHandover(sale)}
                        >
                            {sale.handover ? (
                                <PencilSimpleIcon />
                            ) : isLocked ? (
                                <LockKeyIcon />
                            ) : (
                                <KeyIcon />
                            )}
                            {sale.handover
                                ? 'Perbarui'
                                : isLocked
                                  ? 'Terkunci'
                                  : 'Catat'}
                        </Button>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label={`Aksi ${sale.invoice_number}`}
                                >
                                    <DotsThreeVerticalIcon />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52">
                                <DropdownMenuLabel>
                                    Aksi lainnya
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link href={salesShow(sale.id)}>
                                        <EyeIcon />
                                        Detail penjualan
                                    </Link>
                                </DropdownMenuItem>
                                {sale.handover?.vehicle_delivered_at && (
                                    <DropdownMenuItem asChild>
                                        <Link
                                            href={VehicleHandoverController.printBast.url(
                                                sale.id,
                                            )}
                                        >
                                            <PrinterIcon />
                                            Cetak BAST
                                        </Link>
                                    </DropdownMenuItem>
                                )}
                                {sale.handover?.proof_file && (
                                    <DropdownMenuItem asChild>
                                        <a
                                            href={`/handovers/${sale.handover.id}/proof`}
                                        >
                                            <FileArrowDownIcon />
                                            Unduh bukti
                                        </a>
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                );
            },
        }),
    ]);
}

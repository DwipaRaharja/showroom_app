import { Link } from '@inertiajs/react';
import {
    CalendarBlankIcon,
    CaretDownIcon,
    CaretUpDownIcon,
    CaretUpIcon,
    DotsThreeVerticalIcon,
    EyeIcon,
    FileArrowDownIcon,
    MapPinIcon,
    PackageIcon,
    PencilSimpleIcon,
    PrinterIcon,
    UserIcon,
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
import { Checkbox } from '@/components/ui/checkbox';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type {
    Sale,
    VehicleHandover,
    VehicleHandoverEvent,
} from '@/pages/sales/types';
import { show as salesShow } from '@/routes/sales';

export type HandoverFilterStatus =
    'vehicle_delivery' | 'document_delivery' | 'item_delivery';

export type HandoverRecord = {
    id: number;
    sale: Sale;
    handover: VehicleHandover;
    event: VehicleHandoverEvent;
};

export const handoverStatusOptions: Array<{
    value: HandoverFilterStatus;
    label: string;
}> = [
    { value: 'vehicle_delivery', label: 'Penyerahan unit' },
    { value: 'document_delivery', label: 'Penyerahan dokumen' },
    { value: 'item_delivery', label: 'Penyerahan barang' },
];

export const handoverColumnLabels: Record<string, string> = {
    occurred_at: 'Tanggal dan waktu',
    transaction: 'Transaksi dan unit',
    items: 'Yang diserahkan',
    recipient: 'Penerima',
    officer: 'Petugas dan lokasi',
    photos: 'Bukti foto',
    event_type: 'Jenis penyerahan',
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

const columnHelper = createColumnHelper<
    typeof handoverTableFeatures,
    HandoverRecord
>();

const dateTimeFormatter = new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
});

const relationLabels = {
    buyer_self: 'Pembeli sendiri',
    family: 'Keluarga',
    driver: 'Sopir',
    leasing_officer: 'Petugas leasing',
    other: 'Pihak lainnya',
};

const eventTypeConfig = {
    vehicle_delivery: {
        label: 'Penyerahan unit',
        className:
            'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    },
    document_delivery: {
        label: 'Penyerahan dokumen',
        className:
            'border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300',
    },
    item_delivery: {
        label: 'Penyerahan barang',
        className:
            'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
    },
};

export function createHandoverRecords(sales: Sale[]): HandoverRecord[] {
    return sales.flatMap((sale) => {
        const handover = sale.handover;

        if (!handover) {
            return [];
        }

        return handover.events.map((event) => ({
            id: event.id,
            sale,
            handover,
            event,
        }));
    });
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
            aria-sort={
                isSorted === 'asc'
                    ? 'ascending'
                    : isSorted === 'desc'
                      ? 'descending'
                      : 'none'
            }
        >
            {label}
            {isSorted === 'asc' ? (
                <CaretUpIcon className="size-4" />
            ) : isSorted === 'desc' ? (
                <CaretDownIcon className="size-4" />
            ) : (
                <CaretUpDownIcon className="size-4 opacity-60" />
            )}
        </Button>
    );
}

export function createHandoverColumns(onManageHandover: (sale: Sale) => void) {
    return columnHelper.columns([
        columnHelper.display({
            id: 'select',
            enableHiding: false,
            enableSorting: false,
            header: ({ table }) => (
                <Checkbox
                    checked={
                        table.getIsAllPageRowsSelected() ||
                        (table.getIsSomePageRowsSelected() && 'indeterminate')
                    }
                    onCheckedChange={(value) =>
                        table.toggleAllPageRowsSelected(value === true)
                    }
                    aria-label="Pilih semua riwayat pada halaman ini"
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) =>
                        row.toggleSelected(value === true)
                    }
                    aria-label={`Pilih penyerahan kepada ${row.original.event.recipient_name}`}
                />
            ),
        }),
        columnHelper.accessor((record) => record.event.occurred_at, {
            id: 'number',
            header: ({ column }) => (
                <SortableHeader
                    label="No."
                    isSorted={column.getIsSorted()}
                    onToggle={column.getToggleSortingHandler()}
                />
            ),
            enableHiding: false,
            enableSorting: true,
            sortDescFirst: true,
            cell: ({ row }) => {
                const index = row.getDisplayIndex();

                return index === -1 ? '—' : index + 1;
            },
            sortFn: (rowA, rowB) => {
                const timeA = new Date(
                    rowA.original.event.occurred_at,
                ).getTime();
                const timeB = new Date(
                    rowB.original.event.occurred_at,
                ).getTime();

                return timeA === timeB
                    ? rowA.original.id - rowB.original.id
                    : timeA - timeB;
            },
        }),
        columnHelper.accessor((record) => record.event.occurred_at, {
            id: 'occurred_at',
            header: ({ column }) => (
                <SortableHeader
                    label="Tanggal & Waktu"
                    isSorted={column.getIsSorted()}
                    onToggle={column.getToggleSortingHandler()}
                />
            ),
            cell: ({ row }) => {
                const config = eventTypeConfig[row.original.event.event_type];

                return (
                    <div className="min-w-40 space-y-1.5">
                        <div className="flex items-center gap-1.5 font-medium">
                            <CalendarBlankIcon className="size-4 text-muted-foreground" />
                            {dateTimeFormatter.format(
                                new Date(row.original.event.occurred_at),
                            )}
                        </div>
                        <Badge variant="outline" className={config.className}>
                            {config.label}
                        </Badge>
                    </div>
                );
            },
        }),
        columnHelper.accessor(
            (record) =>
                [
                    record.sale.invoice_number,
                    record.handover.handover_number,
                    record.sale.car?.brand?.name,
                    record.sale.car?.name,
                    record.sale.car?.license_plate,
                    record.sale.customer?.name,
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
                    const { sale, handover } = row.original;

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
                                <span className="font-mono">
                                    {handover.handover_number}
                                </span>
                            </div>
                        </div>
                    );
                },
            },
        ),
        columnHelper.accessor(
            (record) =>
                record.event.items
                    .map((item) => `${item.item_name} ${item.quantity}`)
                    .join(' '),
            {
                id: 'items',
                header: 'Yang Diserahkan',
                cell: ({ row }) => (
                    <div className="flex max-w-72 min-w-52 flex-wrap gap-1.5">
                        {row.original.event.items.map((item) => (
                            <Badge key={item.id} variant="secondary">
                                <PackageIcon />
                                {item.item_name}
                                {item.quantity > 1 ? ` (${item.quantity})` : ''}
                            </Badge>
                        ))}
                    </div>
                ),
            },
        ),
        columnHelper.accessor(
            (record) =>
                [
                    record.event.recipient_name,
                    record.event.recipient_phone,
                    record.event.recipient_id_card,
                    relationLabels[record.event.recipient_relation],
                ]
                    .filter(Boolean)
                    .join(' '),
            {
                id: 'recipient',
                header: ({ column }) => (
                    <SortableHeader
                        label="Penerima"
                        isSorted={column.getIsSorted()}
                        onToggle={column.getToggleSortingHandler()}
                    />
                ),
                cell: ({ row }) => {
                    const event = row.original.event;

                    return (
                        <div className="min-w-44 space-y-0.5">
                            <div className="flex items-center gap-1.5 font-semibold">
                                <UserIcon className="size-4 text-muted-foreground" />
                                {event.recipient_name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                                {relationLabels[event.recipient_relation]}
                            </div>
                            {event.recipient_phone && (
                                <div className="text-xs text-muted-foreground">
                                    {event.recipient_phone}
                                </div>
                            )}
                            {event.recipient_id_card && (
                                <div className="font-mono text-xs text-muted-foreground">
                                    NIK {event.recipient_id_card}
                                </div>
                            )}
                        </div>
                    );
                },
            },
        ),
        columnHelper.accessor(
            (record) =>
                [
                    record.event.officer_name,
                    record.event.handover_location,
                    record.event.handover_address,
                ]
                    .filter(Boolean)
                    .join(' '),
            {
                id: 'officer',
                header: 'Petugas & Lokasi',
                cell: ({ row }) => {
                    const event = row.original.event;

                    return (
                        <div className="min-w-48 space-y-1 text-sm">
                            <div className="font-medium">
                                {event.officer_name}
                            </div>
                            <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                                <MapPinIcon className="mt-0.5 size-3.5 shrink-0" />
                                <span>
                                    {event.handover_location}
                                    {event.handover_address
                                        ? `, ${event.handover_address}`
                                        : ''}
                                </span>
                            </div>
                        </div>
                    );
                },
            },
        ),
        columnHelper.accessor((record) => record.event.photos.length, {
            id: 'photos',
            header: 'Bukti Foto',
            enableSorting: true,
            cell: ({ row }) => {
                const photos = row.original.event.photos;

                if (photos.length === 0) {
                    return (
                        <span className="text-sm text-muted-foreground">
                            Tidak ada
                        </span>
                    );
                }

                return (
                    <div className="min-w-24 space-y-1">
                        <div className="text-sm font-medium">
                            {photos.length} foto
                        </div>
                        <a
                            href={`/handover-photos/${photos[0].id}`}
                            className="text-xs font-medium text-primary hover:underline"
                        >
                            Unduh foto pertama
                        </a>
                    </div>
                );
            },
        }),
        columnHelper.accessor((record) => record.event.event_type, {
            id: 'event_type',
            header: 'Jenis Penyerahan',
            filterFn: 'equals',
            enableSorting: false,
            enableHiding: true,
            cell: ({ getValue }) => eventTypeConfig[getValue()].label,
        }),
        columnHelper.display({
            id: 'actions',
            header: () => <span className="sr-only">Aksi</span>,
            enableHiding: false,
            enableSorting: false,
            cell: ({ row }) => {
                const { sale, handover, event } = row.original;

                return (
                    <div className="flex justify-end">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-8"
                                    aria-label={`Buka aksi penyerahan kepada ${event.recipient_name}`}
                                >
                                    <DotsThreeVerticalIcon className="size-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-60">
                                <DropdownMenuLabel>
                                    Aksi Penyerahan
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link href={salesShow(sale.id)}>
                                        <EyeIcon />
                                        Detail penjualan
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onSelect={() => onManageHandover(sale)}
                                >
                                    <PencilSimpleIcon />
                                    Lihat / tambah tracking
                                </DropdownMenuItem>
                                {handover.vehicle_delivered_at && (
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
                                {event.photos[0] && (
                                    <DropdownMenuItem asChild>
                                        <a
                                            href={`/handover-photos/${event.photos[0].id}`}
                                        >
                                            <FileArrowDownIcon />
                                            Unduh foto pertama
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

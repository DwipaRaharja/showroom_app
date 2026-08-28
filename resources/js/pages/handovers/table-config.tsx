import { Link } from '@inertiajs/react';
import {
    CalendarBlankIcon,
    ClockCounterClockwiseIcon,
    DotsThreeVerticalIcon,
    EyeIcon,
    PackageIcon,
    PlusIcon,
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
    rowSortingFeature,
    sortFn_text,
    tableFeatures,
} from '@tanstack/react-table';
import VehicleHandoverController from '@/actions/App/Http/Controllers/VehicleHandoverController';
import { SortableTableHeader } from '@/components/data-table/sortable-table-header';
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
import { formatDateTime } from '@/lib/formatters';
import { HandoverPhotoPreview } from '@/pages/handovers/photo-preview';
import type {
    Sale,
    VehicleHandover,
    VehicleHandoverEvent,
    VehicleHandoverItem,
    VehicleHandoverPhoto,
} from '@/pages/sales/types';
import { show as salesShow } from '@/routes/sales';

export type HandoverFilterStatus =
    'locked' | 'ready' | 'pending' | 'vehicle_delivered' | 'completed';

export type HandoverRecord = {
    id: number;
    sale: Sale;
    handover: VehicleHandover | null;
    events: VehicleHandoverEvent[];
    latestEvent: VehicleHandoverEvent | null;
    items: VehicleHandoverItem[];
    photos: VehicleHandoverPhoto[];
    status: HandoverFilterStatus;
};

export const handoverStatusOptions: Array<{
    value: HandoverFilterStatus;
    label: string;
}> = [
    { value: 'locked', label: 'Masih terkunci' },
    { value: 'ready', label: 'Siap diserahkan' },
    { value: 'pending', label: 'Tracking berjalan' },
    { value: 'vehicle_delivered', label: 'Unit sudah diserahkan' },
    { value: 'completed', label: 'Selesai lengkap' },
];

export const handoverColumnLabels: Record<string, string> = {
    transaction: 'Penjualan dan unit',
    status: 'Status penyerahan',
    summary: 'Ringkasan tracking',
    items: 'Sudah diserahkan',
    recipient: 'Penerima terakhir',
    photos: 'Bukti foto',
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
    columnVisibilityFeature,
});

const columnHelper = createColumnHelper<
    typeof handoverTableFeatures,
    HandoverRecord
>();

const relationLabels = {
    buyer_self: 'Pembeli sendiri',
    family: 'Keluarga',
    driver: 'Sopir',
    leasing_officer: 'Petugas leasing',
    other: 'Pihak lainnya',
};

const statusConfig: Record<
    HandoverFilterStatus,
    { label: string; className: string }
> = {
    locked: {
        label: 'Masih terkunci',
        className: 'border-red-500/30 bg-red-500/10 text-red-500',
    },
    ready: {
        label: 'Siap diserahkan',
        className:
            'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
    },
    pending: {
        label: 'Tracking berjalan',
        className:
            'border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300',
    },
    vehicle_delivered: {
        label: 'Unit diserahkan',
        className:
            'border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300',
    },
    completed: {
        label: 'Selesai lengkap',
        className:
            'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    },
};

function resolveStatus(
    sale: Sale,
    handover: VehicleHandover | null,
): HandoverFilterStatus {
    if (handover?.status === 'completed') {
        return 'completed';
    }

    if (handover?.status === 'vehicle_delivered') {
        return 'vehicle_delivered';
    }

    if (handover && handover.events.length > 0) {
        return 'pending';
    }

    const canDeliverVehicle =
        sale.can_deliver_vehicle ?? sale.status !== 'cancelled';

    return canDeliverVehicle ? 'ready' : 'locked';
}

export function createHandoverRecords(sales: Sale[]): HandoverRecord[] {
    return sales.map((sale) => {
        const handover = sale.handover ?? null;
        const events = [...(handover?.events ?? [])].sort(
            (left, right) =>
                new Date(right.occurred_at).getTime() -
                new Date(left.occurred_at).getTime(),
        );

        return {
            id: sale.id,
            sale,
            handover,
            events,
            latestEvent: events[0] ?? null,
            items: events.flatMap((event) => event.items),
            photos: events.flatMap((event) => event.photos),
            status: resolveStatus(sale, handover),
        };
    });
}

export function createHandoverColumns() {
    return columnHelper.columns([
        columnHelper.accessor(
            (record) => record.latestEvent?.occurred_at ?? record.sale.id,
            {
                id: 'number',
                header: ({ column }) => (
                    <SortableTableHeader
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
                    const latestA = rowA.original.latestEvent;
                    const latestB = rowB.original.latestEvent;
                    const timeA = latestA
                        ? new Date(latestA.occurred_at).getTime()
                        : rowA.original.sale.id;
                    const timeB = latestB
                        ? new Date(latestB.occurred_at).getTime()
                        : rowB.original.sale.id;

                    return timeA - timeB;
                },
            },
        ),
        columnHelper.accessor(
            (record) =>
                [
                    record.sale.invoice_number,
                    record.handover?.handover_number,
                    record.sale.car?.brand?.name,
                    record.sale.car?.name,
                    record.sale.car?.license_plate,
                    record.sale.customer?.name,
                    record.sale.customer?.phone,
                ]
                    .filter(Boolean)
                    .join(' '),
            {
                id: 'transaction',
                header: ({ column }) => (
                    <SortableTableHeader
                        label="Penjualan & Unit"
                        isSorted={column.getIsSorted()}
                        onToggle={column.getToggleSortingHandler()}
                    />
                ),
                cell: ({ row }) => {
                    const { sale, handover } = row.original;

                    return (
                        <div className="min-w-60 space-y-0.5">
                            <Link
                                href={salesShow(sale.id)}
                                className="block font-mono text-xs font-semibold text-primary hover:underline"
                            >
                                {sale.invoice_number}
                            </Link>
                            <div className="font-semibold text-foreground">
                                {sale.car?.brand?.name} {sale.car?.name}
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                                <span className="rounded bg-muted px-1.5 py-0.5 font-mono font-medium text-foreground">
                                    {sale.car?.license_plate ?? 'Tanpa plat'}
                                </span>
                                <span>•</span>
                                <span>{sale.customer?.name ?? '—'}</span>
                            </div>
                            {handover && (
                                <div className="font-mono text-[11px] text-muted-foreground">
                                    {handover.handover_number}
                                </div>
                            )}
                        </div>
                    );
                },
            },
        ),
        columnHelper.accessor((record) => record.status, {
            id: 'status',
            header: 'Status Penyerahan',
            filterFn: 'equals',
            enableSorting: true,
            cell: ({ getValue }) => {
                const config = statusConfig[getValue()];

                return (
                    <Badge variant="outline" className={config.className}>
                        {config.label}
                    </Badge>
                );
            },
        }),
        columnHelper.accessor(
            (record) =>
                [
                    `${record.events.length} tracking`,
                    record.latestEvent?.occurred_at,
                    record.latestEvent?.officer_name,
                    record.latestEvent?.handover_location,
                ]
                    .filter(Boolean)
                    .join(' '),
            {
                id: 'summary',
                header: 'Ringkasan Tracking',
                enableSorting: false,
                cell: ({ row }) => {
                    const { events, latestEvent } = row.original;

                    if (!latestEvent) {
                        return (
                            <span className="text-sm text-muted-foreground">
                                Belum ada tracking
                            </span>
                        );
                    }

                    return (
                        <div className="min-w-44 space-y-1">
                            <div className="flex items-center gap-1.5 text-sm font-semibold">
                                <ClockCounterClockwiseIcon className="size-4 text-muted-foreground" />
                                {events.length} kejadian
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <CalendarBlankIcon className="size-3.5" />
                                {formatDateTime(latestEvent.occurred_at)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                                {latestEvent.officer_name} ·{' '}
                                {latestEvent.handover_location}
                            </div>
                        </div>
                    );
                },
            },
        ),
        columnHelper.accessor(
            (record) =>
                record.items
                    .map((item) => `${item.item_name} ${item.quantity}`)
                    .join(' '),
            {
                id: 'items',
                header: 'Sudah Diserahkan',
                enableSorting: false,
                cell: ({ row }) => {
                    const visibleItems = row.original.items.slice(0, 4);
                    const remainingItems =
                        row.original.items.length - visibleItems.length;

                    if (visibleItems.length === 0) {
                        return (
                            <span className="text-sm text-muted-foreground">
                                Belum ada
                            </span>
                        );
                    }

                    return (
                        <div className="flex max-w-72 min-w-52 flex-wrap gap-1.5">
                            {visibleItems.map((item) => (
                                <Badge key={item.id} variant="secondary">
                                    <PackageIcon />
                                    {item.item_name}
                                    {item.quantity > 1
                                        ? ` (${item.quantity})`
                                        : ''}
                                </Badge>
                            ))}
                            {remainingItems > 0 && (
                                <Badge variant="outline">
                                    +{remainingItems} lainnya
                                </Badge>
                            )}
                        </div>
                    );
                },
            },
        ),
        columnHelper.accessor(
            (record) => {
                const event = record.latestEvent;

                return event
                    ? [
                          event.recipient_name,
                          event.recipient_phone,
                          relationLabels[event.recipient_relation],
                      ]
                          .filter(Boolean)
                          .join(' ')
                    : '';
            },
            {
                id: 'recipient',
                header: 'Penerima Terakhir',
                enableSorting: true,
                cell: ({ row }) => {
                    const event = row.original.latestEvent;

                    if (!event) {
                        return (
                            <span className="text-sm text-muted-foreground">
                                Belum ada
                            </span>
                        );
                    }

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
                        </div>
                    );
                },
            },
        ),
        columnHelper.accessor((record) => record.photos.length, {
            id: 'photos',
            header: 'Bukti Foto',
            enableSorting: true,
            cell: ({ row }) =>
                row.original.photos.length > 0 ? (
                    <HandoverPhotoPreview photos={row.original.photos} />
                ) : (
                    <span className="text-sm text-muted-foreground">
                        Belum ada
                    </span>
                ),
        }),
        columnHelper.display({
            id: 'actions',
            header: () => <span className="sr-only">Aksi</span>,
            enableHiding: false,
            enableSorting: false,
            cell: ({ row }) => {
                const { sale, handover, photos } = row.original;
                const canDeliverVehicle =
                    sale.can_deliver_vehicle ?? sale.status !== 'cancelled';
                const canAddTracking =
                    sale.status !== 'cancelled' &&
                    (canDeliverVehicle ||
                        handover?.vehicle_delivered_at != null);

                return (
                    <div className="flex justify-end">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-8"
                                    aria-label={`Buka aksi penyerahan ${sale.invoice_number}`}
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
                                <DropdownMenuItem asChild>
                                    <Link
                                        href={VehicleHandoverController.show.url(
                                            sale.id,
                                        )}
                                    >
                                        <ClockCounterClockwiseIcon />
                                        Lihat tracking
                                    </Link>
                                </DropdownMenuItem>
                                {canAddTracking ? (
                                    <DropdownMenuItem asChild>
                                        <Link
                                            href={VehicleHandoverController.create.url(
                                                sale.id,
                                            )}
                                        >
                                            <PlusIcon />
                                            Tambah tracking
                                        </Link>
                                    </DropdownMenuItem>
                                ) : (
                                    <DropdownMenuItem disabled>
                                        <PlusIcon />
                                        Tambah tracking (terkunci)
                                    </DropdownMenuItem>
                                )}
                                {handover?.vehicle_delivered_at && (
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
                                {photos[0] && (
                                    <DropdownMenuItem asChild>
                                        <a
                                            href={VehicleHandoverController.showPhoto.url(
                                                photos[0].id,
                                            )}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            <EyeIcon />
                                            Lihat foto pertama
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

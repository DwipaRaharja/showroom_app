import { Link } from '@inertiajs/react';
import {
    ArchiveBoxIcon,
    ArrowCounterClockwiseIcon,
    CarProfileIcon,
    CopyIcon,
    DotsThreeVerticalIcon,
    EyeIcon,
    FileTextIcon,
    GasPumpIcon,
    PencilSimpleIcon,
    TagIcon,
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
import CarController from '@/actions/App/Http/Controllers/CarController';
import { SortableTableHeader } from '@/components/data-table/sortable-table-header';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { copyToClipboard } from '@/lib/clipboard';
import { formatCurrency, formatDate, formatNumber } from '@/lib/formatters';
import type {
    Car,
    CarStatus,
    FuelType,
    Transmission,
} from '@/pages/cars/types';
import {
    countCompleteRequiredDocuments,
    getCarDocumentState,
    requiredDocumentTypes,
} from '@/pages/cars/vehicle-document-utils';

export const carTableFeatures = tableFeatures({
    columnFilteringFeature,
    globalFilteringFeature,
    filteredRowModel: createFilteredRowModel(),
    filterFns: {
        equals: filterFn_equals,
        includesString: filterFn_includesString,
    },
    rowSortingFeature,
    sortedRowModel: createSortedRowModel(),
    sortFns: {
        text: sortFn_text,
    },
    rowPaginationFeature,
    paginatedRowModel: createPaginatedRowModel(),
    columnVisibilityFeature,
});

const columnHelper = createColumnHelper<typeof carTableFeatures, Car>();

export function getStatusBadge(status: CarStatus) {
    return <StatusBadge status={status} />;
}

export function formatTransmission(transmission: Transmission) {
    switch (transmission) {
        case 'automatic':
            return 'A/T (Otomatis)';
        case 'manual':
            return 'M/T (Manual)';
        case 'cvt':
            return 'CVT';
        default:
            return transmission;
    }
}

export function formatFuel(fuel: FuelType) {
    switch (fuel) {
        case 'bensin':
            return 'Bensin';
        case 'diesel':
            return 'Diesel';
        case 'hybrid':
            return 'Hybrid';
        case 'electric':
            return 'Listrik (EV)';
        default:
            return fuel;
    }
}

type CarColumnActions = {
    onStatusChange: (car: Car) => void;
    onManageDocuments: (car: Car) => void;
    onDelete: (car: Car) => void;
    onRestore: (car: Car) => void;
};

export function createCarColumns({
    onStatusChange,
    onManageDocuments,
    onDelete,
    onRestore,
}: CarColumnActions) {
    return columnHelper.columns([
        columnHelper.accessor('created_at', {
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
                const timeA = new Date(rowA.original.created_at).getTime();
                const timeB = new Date(rowB.original.created_at).getTime();

                if (timeA === timeB) {
                    return rowA.original.id - rowB.original.id;
                }

                return timeA - timeB;
            },
        }),
        columnHelper.accessor('name', {
            header: ({ column }) => (
                <SortableTableHeader
                    label="Unit Mobil"
                    isSorted={column.getIsSorted()}
                    onToggle={column.getToggleSortingHandler()}
                />
            ),
            cell: ({ row }) => (
                <div className="flex min-w-56 items-center gap-3">
                    {row.original.image ? (
                        <img
                            src={CarController.image.url(row.original.id, {
                                query: { v: row.original.updated_at },
                            })}
                            alt={row.original.name}
                            className="size-12 shrink-0 rounded-lg border object-cover"
                            loading="lazy"
                        />
                    ) : (
                        <div className="flex size-12 shrink-0 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
                            <CarProfileIcon className="size-6" />
                        </div>
                    )}
                    <div className="min-w-0">
                        <div className="truncate font-semibold text-foreground">
                            {row.original.name}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-xs text-muted-foreground">
                            {row.original.brand && (
                                <span className="font-medium text-primary">
                                    {row.original.brand.name}
                                </span>
                            )}
                            <span>•</span>
                            <span>{row.original.year}</span>
                            {row.original.color && (
                                <>
                                    <span>•</span>
                                    <span>{row.original.color}</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            ),
            filterFn: 'includesString',
            sortFn: 'text',
        }),
        columnHelper.accessor('license_plate', {
            header: ({ column }) => (
                <SortableTableHeader
                    label="Plat Nomor"
                    isSorted={column.getIsSorted()}
                    onToggle={column.getToggleSortingHandler()}
                />
            ),
            cell: ({ getValue }) => {
                const plate = getValue();

                if (!plate) {
                    return <span className="text-muted-foreground">—</span>;
                }

                return (
                    <code className="rounded bg-muted px-2 py-0.5 font-mono text-xs font-semibold tracking-wider">
                        {plate}
                    </code>
                );
            },
            filterFn: 'includesString',
            sortFn: 'text',
        }),
        columnHelper.accessor('transmission', {
            id: 'specs',
            header: 'Spesifikasi',
            cell: ({ row }) => (
                <div className="min-w-32 space-y-0.5 text-xs">
                    <div>{formatTransmission(row.original.transmission)}</div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                        <GasPumpIcon className="size-3.5" />
                        {formatFuel(row.original.fuel_type)}
                    </div>
                </div>
            ),
        }),
        columnHelper.accessor('mileage', {
            header: ({ column }) => (
                <SortableTableHeader
                    label="Kilometer"
                    isSorted={column.getIsSorted()}
                    onToggle={column.getToggleSortingHandler()}
                />
            ),
            cell: ({ getValue }) => (
                <div className="text-sm font-medium">
                    {formatNumber(getValue())} km
                </div>
            ),
            sortFn: (rowA, rowB) =>
                rowA.original.mileage - rowB.original.mileage,
        }),
        columnHelper.accessor('selling_price', {
            header: ({ column }) => (
                <SortableTableHeader
                    label="Harga Jual"
                    isSorted={column.getIsSorted()}
                    onToggle={column.getToggleSortingHandler()}
                />
            ),
            cell: ({ row }) => (
                <div className="min-w-32">
                    <div className="font-semibold text-emerald-600 dark:text-emerald-500">
                        {formatCurrency(row.original.selling_price)}
                    </div>
                    {row.original.capital && (
                        <div className="text-xs text-muted-foreground">
                            Modal:{' '}
                            {formatCurrency(row.original.capital.total_capital)}
                            {row.original.capital.status !== 'completed' &&
                                ` · ${
                                    row.original.capital.status === 'draft'
                                        ? 'Draft'
                                        : 'Dibatalkan'
                                }`}
                        </div>
                    )}
                    {!row.original.capital && (
                        <div className="text-xs font-medium text-amber-600 dark:text-amber-500">
                            Modal belum lengkap
                        </div>
                    )}
                </div>
            ),
            sortFn: (rowA, rowB) =>
                rowA.original.selling_price - rowB.original.selling_price,
        }),
        columnHelper.accessor(
            (car) => getCarDocumentState(car.documents ?? []),
            {
                id: 'documents',
                header: ({ column }) => (
                    <SortableTableHeader
                        label="Dokumen"
                        isSorted={column.getIsSorted()}
                        onToggle={column.getToggleSortingHandler()}
                    />
                ),
                cell: ({ row, getValue }) => (
                    <div className="min-w-28 space-y-1">
                        <StatusBadge status={getValue()} />
                        <div className="text-xs text-muted-foreground">
                            {countCompleteRequiredDocuments(
                                row.original.documents ?? [],
                            )}
                            /{requiredDocumentTypes.length} dokumen inti
                        </div>
                    </div>
                ),
                filterFn: 'equals',
                sortFn: 'text',
            },
        ),
        columnHelper.accessor(
            (row) => row.deleted_at !== null && row.deleted_at !== undefined,
            {
                id: 'is_archived',
                header: ({ column }) => (
                    <SortableTableHeader
                        label="Status Data"
                        isSorted={column.getIsSorted()}
                        onToggle={column.getToggleSortingHandler()}
                    />
                ),
                cell: ({ getValue }) => (
                    <StatusBadge status={getValue() ? 'archived' : 'active'} />
                ),
                filterFn: 'equals',
                sortFn: 'text',
            },
        ),
        columnHelper.accessor('status', {
            header: ({ column }) => (
                <SortableTableHeader
                    label="Status Unit"
                    isSorted={column.getIsSorted()}
                    onToggle={column.getToggleSortingHandler()}
                />
            ),
            cell: ({ getValue }) => getStatusBadge(getValue()),
            filterFn: 'equals',
        }),
        columnHelper.accessor('created_at', {
            header: ({ column }) => (
                <SortableTableHeader
                    label="Dibuat"
                    isSorted={column.getIsSorted()}
                    onToggle={column.getToggleSortingHandler()}
                />
            ),
            cell: ({ getValue }) => formatDate(getValue()),
            sortFn: 'text',
        }),
        columnHelper.display({
            id: 'actions',
            header: () => <span className="sr-only">Aksi</span>,
            enableHiding: false,
            enableSorting: false,
            cell: ({ row }) => {
                const isArchived = Boolean(row.original.deleted_at);

                return (
                    <div className="flex justify-end">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-8"
                                    aria-label={`Buka aksi untuk ${row.original.name}`}
                                >
                                    <DotsThreeVerticalIcon className="size-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link
                                        href={CarController.show(
                                            row.original.id,
                                        )}
                                    >
                                        <EyeIcon />
                                        Detail unit mobil
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onSelect={() =>
                                        void copyToClipboard(
                                            String(row.original.id),
                                            'ID mobil',
                                        )
                                    }
                                >
                                    <CopyIcon />
                                    Salin ID
                                </DropdownMenuItem>
                                {row.original.license_plate && (
                                    <DropdownMenuItem
                                        onSelect={() =>
                                            void copyToClipboard(
                                                row.original.license_plate ??
                                                    '',
                                                'Plat nomor',
                                            )
                                        }
                                    >
                                        <CopyIcon />
                                        Salin Plat Nomor
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                    onSelect={() =>
                                        void copyToClipboard(
                                            row.original.name,
                                            'Nama mobil',
                                        )
                                    }
                                >
                                    <CopyIcon />
                                    Salin Nama Mobil
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {!isArchived && (
                                    <>
                                        <DropdownMenuItem
                                            onSelect={() =>
                                                onManageDocuments(row.original)
                                            }
                                        >
                                            <FileTextIcon />
                                            Kelola dokumen
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onSelect={() =>
                                                onStatusChange(row.original)
                                            }
                                        >
                                            <TagIcon />
                                            Ubah status unit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link
                                                href={CarController.edit(
                                                    row.original.id,
                                                )}
                                            >
                                                <PencilSimpleIcon />
                                                Edit mobil
                                            </Link>
                                        </DropdownMenuItem>
                                    </>
                                )}
                                {isArchived ? (
                                    <DropdownMenuItem
                                        className="text-emerald-600 focus:text-emerald-600 dark:text-emerald-500 dark:focus:text-emerald-500"
                                        onSelect={() => onRestore(row.original)}
                                    >
                                        <ArrowCounterClockwiseIcon className="text-emerald-600 dark:text-emerald-500" />
                                        Pulihkan mobil
                                    </DropdownMenuItem>
                                ) : (
                                    <DropdownMenuItem
                                        className="text-red-500 focus:text-red-500"
                                        onSelect={() => onDelete(row.original)}
                                    >
                                        <ArchiveBoxIcon className="text-red-500" />
                                        Arsipkan mobil
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

export const carColumnLabels: Record<string, string> = {
    name: 'Unit Mobil',
    license_plate: 'Plat Nomor',
    specs: 'Spesifikasi',
    mileage: 'Kilometer',
    selling_price: 'Harga Jual',
    documents: 'Dokumen',
    is_archived: 'Status Data',
    status: 'Status Unit',
    created_at: 'Tanggal Dibuat',
};

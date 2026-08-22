import { Link } from '@inertiajs/react';
import {
    CaretDownIcon,
    CaretUpDownIcon,
    CaretUpIcon,
    CopyIcon,
    DotsThreeVerticalIcon,
    EyeIcon,
    PencilSimpleIcon,
    TagIcon,
    TrashIcon,
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
import { toast } from 'sonner';
import PurchaseController from '@/actions/App/Http/Controllers/PurchaseController';
import { StatusBadge } from '@/components/status-badge';
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
import type { Purchase, PurchaseStatus } from '@/pages/purchases/types';

export const purchaseTableFeatures = tableFeatures({
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
    rowSelectionFeature,
    columnVisibilityFeature,
});

const columnHelper = createColumnHelper<
    typeof purchaseTableFeatures,
    Purchase
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

async function copyText(value: string, label: string) {
    try {
        await navigator.clipboard.writeText(value);
        toast.success(`${label} berhasil disalin.`);
    } catch {
        toast.error(`${label} gagal disalin.`);
    }
}

export function formatCapitalStatus(status: PurchaseStatus): string {
    const labels: Record<PurchaseStatus, string> = {
        draft: 'Draft',
        completed: 'Aktif',
        cancelled: 'Dibatalkan',
    };

    return labels[status];
}

type PurchaseColumnActions = {
    onDetail: (purchase: Purchase) => void;
    onStatusChange: (purchase: Purchase) => void;
    onDelete: (purchase: Purchase) => void;
};

export function createPurchaseColumns({
    onDetail,
    onStatusChange,
    onDelete,
}: PurchaseColumnActions) {
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
                    aria-label="Pilih semua data modal pada halaman ini"
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) =>
                        row.toggleSelected(value === true)
                    }
                    aria-label={`Pilih modal ${row.original.purchase_number}`}
                />
            ),
        }),
        columnHelper.accessor('created_at', {
            id: 'number',
            header: ({ column }) => (
                <SortableHeader
                    label="No."
                    isSorted={column.getIsSorted()}
                    onToggle={column.getToggleSortingHandler()}
                />
            ),
            enableHiding: false,
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
        columnHelper.accessor('purchase_number', {
            header: ({ column }) => (
                <SortableHeader
                    label="Kode Modal"
                    isSorted={column.getIsSorted()}
                    onToggle={column.getToggleSortingHandler()}
                />
            ),
            cell: ({ getValue }) => (
                <code className="rounded bg-muted px-2 py-1 font-mono text-xs font-semibold">
                    {getValue()}
                </code>
            ),
            filterFn: 'includesString',
            sortFn: 'text',
        }),
        columnHelper.accessor(
            (row) =>
                [
                    row.car?.brand?.name,
                    row.car?.name,
                    row.car?.license_plate,
                    row.car?.year,
                ]
                    .filter(Boolean)
                    .join(' '),
            {
                id: 'car',
                header: ({ column }) => (
                    <SortableHeader
                        label="Unit Mobil"
                        isSorted={column.getIsSorted()}
                        onToggle={column.getToggleSortingHandler()}
                    />
                ),
                cell: ({ row }) =>
                    row.original.car ? (
                        <div className="min-w-48">
                            <div className="font-semibold">
                                {row.original.car.brand?.name
                                    ? `${row.original.car.brand.name} `
                                    : ''}
                                {row.original.car.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                                {row.original.car.year}
                                {row.original.car.license_plate
                                    ? ` · ${row.original.car.license_plate}`
                                    : ''}
                            </div>
                        </div>
                    ) : (
                        <span className="text-muted-foreground">
                            Mobil telah dihapus
                        </span>
                    ),
                filterFn: 'includesString',
                sortFn: 'text',
            },
        ),
        columnHelper.accessor('purchase_date', {
            header: ({ column }) => (
                <SortableHeader
                    label="Tanggal"
                    isSorted={column.getIsSorted()}
                    onToggle={column.getToggleSortingHandler()}
                />
            ),
            cell: ({ getValue }) => dateFormatter.format(new Date(getValue())),
            sortFn: 'text',
        }),
        columnHelper.accessor('price', {
            header: ({ column }) => (
                <SortableHeader
                    label="Harga Perolehan"
                    isSorted={column.getIsSorted()}
                    onToggle={column.getToggleSortingHandler()}
                />
            ),
            cell: ({ getValue }) => (
                <span className="font-semibold text-emerald-600 tabular-nums dark:text-emerald-500">
                    {currencyFormatter.format(getValue())}
                </span>
            ),
            sortFn: (rowA, rowB) => rowA.original.price - rowB.original.price,
        }),
        columnHelper.accessor(
            (row) => row.repair_cost + row.transport_cost + row.other_cost,
            {
                id: 'additional_cost',
                header: ({ column }) => (
                    <SortableHeader
                        label="Biaya Tambahan"
                        isSorted={column.getIsSorted()}
                        onToggle={column.getToggleSortingHandler()}
                    />
                ),
                cell: ({ getValue }) => (
                    <span className="font-medium tabular-nums">
                        {currencyFormatter.format(getValue())}
                    </span>
                ),
                sortFn: (rowA, rowB) => {
                    const additionalA =
                        rowA.original.repair_cost +
                        rowA.original.transport_cost +
                        rowA.original.other_cost;
                    const additionalB =
                        rowB.original.repair_cost +
                        rowB.original.transport_cost +
                        rowB.original.other_cost;

                    return additionalA - additionalB;
                },
            },
        ),
        columnHelper.accessor('total_capital', {
            header: ({ column }) => (
                <SortableHeader
                    label="Total Modal"
                    isSorted={column.getIsSorted()}
                    onToggle={column.getToggleSortingHandler()}
                />
            ),
            cell: ({ getValue }) => (
                <span className="font-bold text-primary tabular-nums">
                    {currencyFormatter.format(getValue())}
                </span>
            ),
            sortFn: (rowA, rowB) =>
                rowA.original.total_capital - rowB.original.total_capital,
        }),
        columnHelper.accessor('status', {
            header: ({ column }) => (
                <SortableHeader
                    label="Status"
                    isSorted={column.getIsSorted()}
                    onToggle={column.getToggleSortingHandler()}
                />
            ),
            cell: ({ getValue }) => (
                <StatusBadge
                    status={getValue()}
                    label={formatCapitalStatus(getValue())}
                />
            ),
            filterFn: 'equals',
        }),
        columnHelper.accessor('created_at', {
            header: ({ column }) => (
                <SortableHeader
                    label="Dibuat"
                    isSorted={column.getIsSorted()}
                    onToggle={column.getToggleSortingHandler()}
                />
            ),
            cell: ({ getValue }) => dateFormatter.format(new Date(getValue())),
            sortFn: 'text',
        }),
        columnHelper.display({
            id: 'actions',
            header: () => <span className="sr-only">Aksi</span>,
            enableHiding: false,
            enableSorting: false,
            cell: ({ row }) => (
                <div className="flex justify-end">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="size-8"
                                aria-label={`Buka aksi untuk ${row.original.purchase_number}`}
                            >
                                <DotsThreeVerticalIcon />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onSelect={() => onDetail(row.original)}
                            >
                                <EyeIcon />
                                Detail modal
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onSelect={() =>
                                    void copyText(
                                        row.original.purchase_number,
                                        'Kode modal',
                                    )
                                }
                            >
                                <CopyIcon />
                                Salin nomor
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onSelect={() => onStatusChange(row.original)}
                            >
                                <TagIcon />
                                Ubah status
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link
                                    href={PurchaseController.edit(
                                        row.original.id,
                                    )}
                                >
                                    <PencilSimpleIcon />
                                    Edit modal
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="text-red-500 focus:text-red-500"
                                onSelect={() => onDelete(row.original)}
                            >
                                <TrashIcon className="text-red-500" />
                                Hapus modal
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            ),
        }),
    ]);
}

export const purchaseColumnLabels: Record<string, string> = {
    purchase_number: 'Kode Modal',
    car: 'Unit Mobil',
    purchase_date: 'Tanggal Pencatatan',
    price: 'Harga Perolehan',
    additional_cost: 'Biaya Tambahan',
    total_capital: 'Total Modal',
    status: 'Status',
    created_at: 'Tanggal Dibuat',
};

export const purchaseStatusOptions: {
    value: PurchaseStatus;
    label: string;
}[] = [
    { value: 'draft', label: 'Draft' },
    { value: 'completed', label: 'Aktif' },
    { value: 'cancelled', label: 'Dibatalkan' },
];

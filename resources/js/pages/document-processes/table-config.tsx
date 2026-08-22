import { Link } from '@inertiajs/react';
import {
    CaretDownIcon,
    CaretUpDownIcon,
    CaretUpIcon,
    CopyIcon,
    DotsThreeVerticalIcon,
    EyeIcon,
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
import DocumentProcessController from '@/actions/App/Http/Controllers/DocumentProcessController';
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
import type { DocumentProcess } from '@/pages/document-processes/types';
import {
    getProcessStatusLabel,
    getProcessTypeLabel,
    isProcessOverdue,
} from '@/pages/document-processes/utils';

export const documentProcessTableFeatures = tableFeatures({
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
    typeof documentProcessTableFeatures,
    DocumentProcess
>();

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

async function copyNumber(value: string) {
    try {
        await navigator.clipboard.writeText(value);
        toast.success('Nomor proses berhasil disalin.');
    } catch {
        toast.error('Nomor proses gagal disalin.');
    }
}

export function createDocumentProcessColumns() {
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
                    aria-label="Pilih semua proses pada halaman ini"
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) =>
                        row.toggleSelected(value === true)
                    }
                    aria-label={`Pilih ${row.original.process_number}`}
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
            cell: ({ row }) => {
                const index = row.getDisplayIndex();

                return index === -1 ? '—' : index + 1;
            },
            sortFn: (rowA, rowB) => rowA.original.id - rowB.original.id,
        }),
        columnHelper.accessor('process_number', {
            header: ({ column }) => (
                <SortableHeader
                    label="Nomor Proses"
                    isSorted={column.getIsSorted()}
                    onToggle={column.getToggleSortingHandler()}
                />
            ),
            cell: ({ getValue }) => (
                <code className="rounded bg-muted px-2 py-1 text-xs font-semibold">
                    {getValue()}
                </code>
            ),
            filterFn: 'includesString',
            sortFn: 'text',
        }),
        columnHelper.accessor(
            (row) =>
                [
                    row.sale.invoice_number,
                    row.sale.car?.brand?.name,
                    row.sale.car?.name,
                    row.sale.car?.license_plate,
                    row.sale.customer?.name,
                ]
                    .filter(Boolean)
                    .join(' '),
            {
                id: 'transaction',
                header: ({ column }) => (
                    <SortableHeader
                        label="Penjualan & Unit"
                        isSorted={column.getIsSorted()}
                        onToggle={column.getToggleSortingHandler()}
                    />
                ),
                cell: ({ row }) => (
                    <div className="min-w-60">
                        <div className="font-semibold">
                            {row.original.sale.car?.brand?.name}{' '}
                            {row.original.sale.car?.name ?? 'Mobil diarsipkan'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            {row.original.sale.invoice_number} ·{' '}
                            {row.original.sale.customer?.name ?? '—'}
                        </div>
                    </div>
                ),
                filterFn: 'includesString',
                sortFn: 'text',
            },
        ),
        columnHelper.accessor('process_type', {
            header: ({ column }) => (
                <SortableHeader
                    label="Jenis Proses"
                    isSorted={column.getIsSorted()}
                    onToggle={column.getToggleSortingHandler()}
                />
            ),
            cell: ({ getValue }) => getProcessTypeLabel(getValue()),
            filterFn: 'equals',
            sortFn: 'text',
        }),
        columnHelper.accessor((row) => row.assignee?.name ?? '', {
            id: 'assignee',
            header: ({ column }) => (
                <SortableHeader
                    label="Petugas"
                    isSorted={column.getIsSorted()}
                    onToggle={column.getToggleSortingHandler()}
                />
            ),
            cell: ({ row }) =>
                row.original.assignee?.name ?? 'Belum ditentukan',
            sortFn: 'text',
        }),
        columnHelper.accessor('estimated_completion_date', {
            header: ({ column }) => (
                <SortableHeader
                    label="Estimasi Selesai"
                    isSorted={column.getIsSorted()}
                    onToggle={column.getToggleSortingHandler()}
                />
            ),
            cell: ({ row, getValue }) => {
                const value = getValue();
                const overdue = isProcessOverdue(value, row.original.status);

                return value ? (
                    <span
                        className={overdue ? 'font-semibold text-red-500' : ''}
                    >
                        {dateFormatter.format(new Date(value))}
                        {overdue ? ' · Terlambat' : ''}
                    </span>
                ) : (
                    '—'
                );
            },
            sortFn: 'text',
        }),
        columnHelper.accessor('progress_percentage', {
            header: ({ column }) => (
                <SortableHeader
                    label="Progres"
                    isSorted={column.getIsSorted()}
                    onToggle={column.getToggleSortingHandler()}
                />
            ),
            cell: ({ row, getValue }) => (
                <div className="min-w-28 space-y-1">
                    <div className="flex justify-between text-xs">
                        <span>
                            {row.original.completed_items_count}/
                            {row.original.total_items_count}
                        </span>
                        <span className="font-semibold">{getValue()}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted">
                        <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${getValue()}%` }}
                        />
                    </div>
                </div>
            ),
            sortFn: (rowA, rowB) =>
                rowA.original.progress_percentage -
                rowB.original.progress_percentage,
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
                    label={getProcessStatusLabel(getValue())}
                />
            ),
            filterFn: 'equals',
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
                                aria-label={`Buka aksi untuk ${row.original.process_number}`}
                            >
                                <DotsThreeVerticalIcon />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link
                                    href={DocumentProcessController.show(
                                        row.original.id,
                                    )}
                                >
                                    <EyeIcon />
                                    Detail proses
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onSelect={() =>
                                    void copyNumber(row.original.process_number)
                                }
                            >
                                <CopyIcon />
                                Salin nomor
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            ),
        }),
    ]);
}

export const documentProcessColumnLabels: Record<string, string> = {
    process_number: 'Nomor Proses',
    transaction: 'Penjualan & Unit',
    process_type: 'Jenis Proses',
    assignee: 'Petugas',
    estimated_completion_date: 'Estimasi Selesai',
    progress_percentage: 'Progres',
    status: 'Status',
};

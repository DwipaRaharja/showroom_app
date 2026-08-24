import { Link } from '@inertiajs/react';
import {
    CaretDownIcon,
    CaretUpDownIcon,
    CaretUpIcon,
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
    rowSortingFeature,
    sortFn_text,
    tableFeatures,
} from '@tanstack/react-table';
import DocumentProcessController from '@/actions/App/Http/Controllers/DocumentProcessController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type {
    DocumentProcess,
    LabelOptions,
} from '@/pages/document-processes/types';

export const processTableFeatures = tableFeatures({
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

export const processColumnLabels: Record<string, string> = {
    process: 'Proses dan kendaraan',
    process_type: 'Jenis proses',
    responsible: 'Customer dan petugas',
    status: 'Status',
    estimated_completion_date: 'Target selesai',
    cost: 'Biaya',
};

const columnHelper = createColumnHelper<
    typeof processTableFeatures,
    DocumentProcess
>();

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
});

const currencyFormatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
});

const statusClasses: Record<string, string> = {
    waiting_documents:
        'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
    documents_ready:
        'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300',
    submitted:
        'border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300',
    processing:
        'border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300',
    ready_for_pickup:
        'border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300',
    completed:
        'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    returned:
        'border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-300',
    issue: 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300',
    cancelled:
        'border-zinc-500/30 bg-zinc-500/10 text-zinc-700 dark:text-zinc-300',
};

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

export function createProcessColumns(
    typeOptions: LabelOptions,
    statusOptions: LabelOptions,
) {
    return columnHelper.columns([
        columnHelper.accessor('created_at', {
            id: 'number',
            enableHiding: false,
            header: ({ column }) => (
                <SortableHeader
                    label="No."
                    isSorted={column.getIsSorted()}
                    onToggle={column.getToggleSortingHandler()}
                />
            ),
            cell: ({ row }) => row.getDisplayIndex() + 1,
            sortDescFirst: true,
        }),
        columnHelper.accessor(
            (process) =>
                [
                    process.process_number,
                    process.car.brand?.name,
                    process.car.name,
                    process.car.license_plate,
                ]
                    .filter(Boolean)
                    .join(' '),
            {
                id: 'process',
                header: ({ column }) => (
                    <SortableHeader
                        label="Proses & Kendaraan"
                        isSorted={column.getIsSorted()}
                        onToggle={column.getToggleSortingHandler()}
                    />
                ),
                cell: ({ row }) => (
                    <div className="min-w-56">
                        <Link
                            href={DocumentProcessController.show.url(
                                row.original.id,
                            )}
                            className="font-mono text-xs font-semibold text-primary hover:underline"
                        >
                            {row.original.process_number}
                        </Link>
                        <div className="pt-1 font-semibold">
                            {row.original.car.brand?.name}{' '}
                            {row.original.car.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            {row.original.car.license_plate ?? 'Tanpa plat'}
                        </div>
                    </div>
                ),
            },
        ),
        columnHelper.accessor('process_type', {
            id: 'process_type',
            header: 'Jenis Proses',
            filterFn: 'equals',
            cell: ({ getValue }) => (
                <Badge variant="secondary">
                    {typeOptions[getValue()] ?? getValue()}
                </Badge>
            ),
        }),
        columnHelper.accessor(
            (process) =>
                [
                    process.customer?.name,
                    process.assignee?.name,
                    process.processor_name,
                ]
                    .filter(Boolean)
                    .join(' '),
            {
                id: 'responsible',
                header: 'Customer & Petugas',
                cell: ({ row }) => (
                    <div className="min-w-44 text-sm">
                        <div className="font-medium">
                            {row.original.customer?.name ??
                                'Proses internal showroom'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            PIC:{' '}
                            {row.original.assignee?.name ??
                                row.original.processor_name ??
                                'Belum ditentukan'}
                        </div>
                    </div>
                ),
            },
        ),
        columnHelper.accessor('status', {
            id: 'status',
            header: 'Status',
            filterFn: 'equals',
            cell: ({ getValue }) => (
                <Badge variant="outline" className={statusClasses[getValue()]}>
                    {statusOptions[getValue()] ?? getValue()}
                </Badge>
            ),
        }),
        columnHelper.accessor('estimated_completion_date', {
            id: 'estimated_completion_date',
            header: ({ column }) => (
                <SortableHeader
                    label="Target Selesai"
                    isSorted={column.getIsSorted()}
                    onToggle={column.getToggleSortingHandler()}
                />
            ),
            cell: ({ row, getValue }) => {
                const value = getValue();
                const isOverdue =
                    value !== null &&
                    !['completed', 'returned', 'cancelled'].includes(
                        row.original.status,
                    ) &&
                    value.slice(0, 10) < new Date().toISOString().slice(0, 10);

                return (
                    <div
                        className={
                            isOverdue ? 'font-semibold text-red-500' : 'text-sm'
                        }
                    >
                        {value
                            ? dateFormatter.format(new Date(value))
                            : 'Belum ditentukan'}
                    </div>
                );
            },
        }),
        columnHelper.accessor('total_cost', {
            id: 'cost',
            header: ({ column }) => (
                <SortableHeader
                    label="Biaya"
                    isSorted={column.getIsSorted()}
                    onToggle={column.getToggleSortingHandler()}
                />
            ),
            cell: ({ row }) => (
                <div className="min-w-36 text-sm">
                    <div className="font-semibold">
                        {currencyFormatter.format(row.original.total_cost)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                        Modal:{' '}
                        {currencyFormatter.format(
                            row.original.capitalized_cost,
                        )}
                    </div>
                </div>
            ),
        }),
        columnHelper.display({
            id: 'actions',
            enableHiding: false,
            header: () => <span className="sr-only">Aksi</span>,
            cell: ({ row }) => (
                <div className="flex justify-end">
                    <Button variant="ghost" size="icon" asChild>
                        <Link
                            href={DocumentProcessController.show.url(
                                row.original.id,
                            )}
                            aria-label={'Lihat ' + row.original.process_number}
                        >
                            <EyeIcon />
                        </Link>
                    </Button>
                </div>
            ),
        }),
    ]);
}

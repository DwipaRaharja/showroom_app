import { Link } from '@inertiajs/react';
import {
    CarProfileIcon,
    DotsThreeVerticalIcon,
    EyeIcon,
    ProhibitIcon,
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
    rowSortingFeature,
    sortFn_text,
    tableFeatures,
} from '@tanstack/react-table';
import CarController from '@/actions/App/Http/Controllers/CarController';
import DocumentProcessController from '@/actions/App/Http/Controllers/DocumentProcessController';
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
import { formatCurrency, formatDate } from '@/lib/formatters';
import { ProcessStatusBadge } from '@/pages/document-processes/process-status-badge';
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
    estimated_completion_date: 'Jadwal proses',
    cost: 'Biaya',
};

const columnHelper = createColumnHelper<
    typeof processTableFeatures,
    DocumentProcess
>();

function localDateKey(date = new Date()): string {
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);

    return local.toISOString().slice(0, 10);
}

export function createProcessColumns(
    typeOptions: LabelOptions,
    statusOptions: LabelOptions,
    actions: {
        onCancel: (process: DocumentProcess) => void;
        onDelete: (process: DocumentProcess) => void;
    },
) {
    return columnHelper.columns([
        columnHelper.accessor('created_at', {
            id: 'number',
            enableHiding: false,
            enableSorting: true,
            header: ({ column }) => (
                <SortableTableHeader
                    label="No."
                    isSorted={column.getIsSorted()}
                    onToggle={column.getToggleSortingHandler()}
                />
            ),
            cell: ({ row }) => {
                const index = row.getDisplayIndex();

                return index === -1 ? '—' : index + 1;
            },
            sortDescFirst: true,
            sortFn: (rowA, rowB) => {
                const timeA = new Date(rowA.original.created_at).getTime();
                const timeB = new Date(rowB.original.created_at).getTime();

                if (timeA === timeB) {
                    return rowA.original.id - rowB.original.id;
                }

                return timeA - timeB;
            },
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
                    <SortableTableHeader
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
            header: ({ column }) => (
                <SortableTableHeader
                    label="Jenis Proses"
                    isSorted={column.getIsSorted()}
                    onToggle={column.getToggleSortingHandler()}
                />
            ),
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
                    <div className="min-w-48 space-y-0.5 text-sm">
                        <div className="font-medium">
                            {row.original.customer?.name ??
                                'Proses internal showroom'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            PIC:{' '}
                            {row.original.assignee?.name ?? 'Belum ditentukan'}
                        </div>
                        {row.original.processor_name && (
                            <div className="text-xs text-muted-foreground">
                                Biro: {row.original.processor_name}
                            </div>
                        )}
                    </div>
                ),
            },
        ),
        columnHelper.accessor('status', {
            id: 'status',
            header: ({ column }) => (
                <SortableTableHeader
                    label="Status"
                    isSorted={column.getIsSorted()}
                    onToggle={column.getToggleSortingHandler()}
                />
            ),
            filterFn: 'equals',
            cell: ({ getValue }) => (
                <ProcessStatusBadge
                    status={getValue()}
                    labels={statusOptions}
                />
            ),
        }),
        columnHelper.accessor('estimated_completion_date', {
            id: 'estimated_completion_date',
            header: ({ column }) => (
                <SortableTableHeader
                    label="Jadwal Proses"
                    isSorted={column.getIsSorted()}
                    onToggle={column.getToggleSortingHandler()}
                />
            ),
            cell: ({ row, getValue }) => {
                const value = getValue();
                const isOverdue =
                    value !== null &&
                    !['completed', 'cancelled'].includes(row.original.status) &&
                    value.slice(0, 10) < localDateKey();

                return (
                    <div className="min-w-36 space-y-0.5 text-sm">
                        <div className="text-xs text-muted-foreground">
                            Mulai:{' '}
                            {formatDate(row.original.started_at.slice(0, 10))}
                        </div>
                        <div
                            className={
                                isOverdue ? 'font-semibold text-red-500' : ''
                            }
                        >
                            Target:{' '}
                            {value
                                ? formatDate(value.slice(0, 10))
                                : 'Belum ditentukan'}
                        </div>
                    </div>
                );
            },
        }),
        columnHelper.accessor('total_cost', {
            id: 'cost',
            header: ({ column }) => (
                <SortableTableHeader
                    label="Biaya"
                    isSorted={column.getIsSorted()}
                    onToggle={column.getToggleSortingHandler()}
                />
            ),
            cell: ({ row }) => (
                <div className="min-w-36 text-sm">
                    <div className="font-semibold">
                        {formatCurrency(row.original.total_cost)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                        Modal: {formatCurrency(row.original.capitalized_cost)}
                    </div>
                </div>
            ),
        }),
        columnHelper.display({
            id: 'actions',
            enableHiding: false,
            enableSorting: false,
            header: () => <span className="sr-only">Aksi</span>,
            cell: ({ row }) => {
                const process = row.original;

                return (
                    <div className="flex justify-end">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-8"
                                    aria-label={`Buka aksi ${process.process_number}`}
                                >
                                    <DotsThreeVerticalIcon className="size-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link
                                        href={DocumentProcessController.show.url(
                                            process.id,
                                        )}
                                    >
                                        <EyeIcon />
                                        Detail proses
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link
                                        href={CarController.show.url(
                                            process.car.id,
                                        )}
                                    >
                                        <CarProfileIcon />
                                        Detail kendaraan
                                    </Link>
                                </DropdownMenuItem>
                                {(process.can_cancel ||
                                    process.can_delete_permanently) && (
                                    <DropdownMenuSeparator />
                                )}
                                {process.can_cancel && (
                                    <DropdownMenuItem
                                        className="text-red-500 focus:text-red-500"
                                        onSelect={() =>
                                            actions.onCancel(process)
                                        }
                                    >
                                        <ProhibitIcon className="text-red-500" />
                                        Batalkan proses
                                    </DropdownMenuItem>
                                )}
                                {process.can_delete_permanently && (
                                    <DropdownMenuItem
                                        className="text-red-500 focus:text-red-500"
                                        onSelect={() =>
                                            actions.onDelete(process)
                                        }
                                    >
                                        <TrashIcon className="text-red-500" />
                                        Hapus permanen
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

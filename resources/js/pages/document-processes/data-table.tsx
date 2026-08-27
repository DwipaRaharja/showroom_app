import { Link } from '@inertiajs/react';
import { PlusIcon, XIcon } from '@phosphor-icons/react';
import { useTable } from '@tanstack/react-table';
import type {
    ColumnFiltersState,
    ColumnVisibilityState,
    PaginationState,
    SortingState,
} from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import DocumentProcessController from '@/actions/App/Http/Controllers/DocumentProcessController';
import { DataTableColumnVisibility } from '@/components/data-table/data-table-column-visibility';
import { DataTableEmptyState } from '@/components/data-table/data-table-empty-state';
import { DataTablePagination } from '@/components/data-table/data-table-pagination';
import { DataTableSearch } from '@/components/data-table/data-table-search';
import { DataTableShell } from '@/components/data-table/data-table-shell';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { ProcessLifecycleDialog } from '@/pages/document-processes/process-lifecycle-dialog';
import type { ProcessLifecycleAction } from '@/pages/document-processes/process-lifecycle-dialog';
import {
    createProcessColumns,
    processColumnLabels,
    processTableFeatures,
} from '@/pages/document-processes/table-config';
import type {
    DocumentProcess,
    LabelOptions,
} from '@/pages/document-processes/types';

type Props = {
    processes: DocumentProcess[];
    typeOptions: LabelOptions;
    statusOptions: LabelOptions;
};

const initialSorting: SortingState = [{ id: 'number', desc: true }];
const initialPagination: PaginationState = { pageIndex: 0, pageSize: 10 };
const initialColumnVisibility: ColumnVisibilityState = {};

export function ProcessDataTable({
    processes,
    typeOptions,
    statusOptions,
}: Props) {
    const [globalFilter, setGlobalFilter] = useState('');
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [sorting, setSorting] = useState<SortingState>(initialSorting);
    const [pagination, setPagination] =
        useState<PaginationState>(initialPagination);
    const [columnVisibility, setColumnVisibility] =
        useState<ColumnVisibilityState>(initialColumnVisibility);
    const [managedProcess, setManagedProcess] =
        useState<DocumentProcess | null>(null);
    const [lifecycleAction, setLifecycleAction] =
        useState<ProcessLifecycleAction>('cancel');
    const columns = useMemo(
        () =>
            createProcessColumns(typeOptions, statusOptions, {
                onCancel: (process) => {
                    setLifecycleAction('cancel');
                    setManagedProcess(process);
                },
                onDelete: (process) => {
                    setLifecycleAction('delete');
                    setManagedProcess(process);
                },
            }),
        [statusOptions, typeOptions],
    );

    const table = useTable({
        features: processTableFeatures,
        data: processes,
        columns,
        getRowId: (row) => String(row.id),
        getColumnCanGlobalFilter: (column) =>
            ['process', 'responsible'].includes(column.id),
        globalFilterFn: 'includesString',
        enableSortingRemoval: false,
        state: {
            globalFilter,
            columnFilters,
            sorting,
            pagination,
            columnVisibility,
        },
        onGlobalFilterChange: setGlobalFilter,
        onColumnFiltersChange: setColumnFilters,
        onSortingChange: setSorting,
        onPaginationChange: setPagination,
        onColumnVisibilityChange: setColumnVisibility,
        initialState: {
            sorting: initialSorting,
            pagination: initialPagination,
            columnVisibility: initialColumnVisibility,
        },
    });

    const typeFilter = table.getColumn('process_type')?.getFilterValue() as
        string | undefined;
    const statusFilter = table.getColumn('status')?.getFilterValue() as
        string | undefined;
    const filteredCount = table.getFilteredRowModel().rows.length;
    const { pageIndex, pageSize } = pagination;
    const pageCount = Math.max(table.getPageCount(), 1);
    const hasFilters =
        globalFilter.length > 0 ||
        typeFilter !== undefined ||
        statusFilter !== undefined;

    function setColumnFilter(columnId: string, value: string) {
        table
            .getColumn(columnId)
            ?.setFilterValue(value === 'all' ? undefined : value);
        table.setPageIndex(0);
    }

    function resetFilters() {
        setGlobalFilter('');
        setColumnFilters([]);
        setPagination((current) => ({ ...current, pageIndex: 0 }));
    }

    return (
        <>
            <DataTableShell
                title="Data Proses Berkas"
                description={`${filteredCount} dari ${processes.length} proses ditampilkan`}
                actions={
                    <Button asChild>
                        <Link href={DocumentProcessController.create.url()}>
                            <PlusIcon className="size-4" />
                            Tambah Proses Berkas
                        </Link>
                    </Button>
                }
                toolbar={
                    <DataTableToolbar
                        search={
                            <DataTableSearch
                                value={globalFilter}
                                onValueChange={(value) => {
                                    table.setGlobalFilter(value);
                                    table.setPageIndex(0);
                                }}
                                placeholder="Cari nomor, kendaraan, customer, atau petugas..."
                                ariaLabel="Cari proses berkas"
                            />
                        }
                    >
                        <Select
                            value={typeFilter ?? 'all'}
                            onValueChange={(value) =>
                                setColumnFilter('process_type', value)
                            }
                        >
                            <SelectTrigger className="w-48">
                                <SelectValue placeholder="Semua jenis" />
                            </SelectTrigger>
                            <SelectContent align="end">
                                <SelectItem value="all">Semua jenis</SelectItem>
                                {Object.entries(typeOptions).map(
                                    ([value, label]) => (
                                        <SelectItem key={value} value={value}>
                                            {label}
                                        </SelectItem>
                                    ),
                                )}
                            </SelectContent>
                        </Select>

                        <Select
                            value={statusFilter ?? 'all'}
                            onValueChange={(value) =>
                                setColumnFilter('status', value)
                            }
                        >
                            <SelectTrigger className="w-48">
                                <SelectValue placeholder="Semua status" />
                            </SelectTrigger>
                            <SelectContent align="end">
                                <SelectItem value="all">
                                    Semua status
                                </SelectItem>
                                {Object.entries(statusOptions).map(
                                    ([value, label]) => (
                                        <SelectItem key={value} value={value}>
                                            {label}
                                        </SelectItem>
                                    ),
                                )}
                            </SelectContent>
                        </Select>

                        <DataTableColumnVisibility
                            columns={table.getAllLeafColumns()}
                            labels={processColumnLabels}
                        />

                        {hasFilters && (
                            <Button variant="ghost" onClick={resetFilters}>
                                <XIcon />
                                Reset
                            </Button>
                        )}
                    </DataTableToolbar>
                }
                footer={
                    <DataTablePagination
                        pageIndex={pageIndex}
                        pageSize={pageSize}
                        pageCount={pageCount}
                        filteredCount={filteredCount}
                        canPreviousPage={table.getCanPreviousPage()}
                        canNextPage={table.getCanNextPage()}
                        onPageSizeChange={(size) => table.setPageSize(size)}
                        onFirstPage={() => table.firstPage()}
                        onPreviousPage={() => table.previousPage()}
                        onNextPage={() => table.nextPage()}
                        onLastPage={() => table.lastPage()}
                    />
                }
            >
                <div>
                    <Table className="min-w-250">
                        <TableHeader className="bg-muted/40">
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder ? null : (
                                                <table.FlexRender
                                                    header={header}
                                                />
                                            )}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
                            {table.getRowModel().rows.length > 0 ? (
                                table.getRowModel().rows.map((row) => (
                                    <TableRow key={row.id}>
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id}>
                                                <table.FlexRender cell={cell} />
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : (
                                <DataTableEmptyState
                                    colSpan={
                                        table.getVisibleLeafColumns().length
                                    }
                                    title="Proses berkas tidak ditemukan"
                                    description="Ubah kata pencarian atau filter yang digunakan."
                                />
                            )}
                        </TableBody>
                    </Table>
                </div>
            </DataTableShell>
            <ProcessLifecycleDialog
                process={managedProcess}
                action={lifecycleAction}
                onOpenChange={(open) => {
                    if (!open) {
                        setManagedProcess(null);
                    }
                }}
            />
        </>
    );
}

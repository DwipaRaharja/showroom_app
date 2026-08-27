import { PlusIcon, XIcon } from '@phosphor-icons/react';
import { useTable } from '@tanstack/react-table';
import type {
    ColumnFiltersState,
    ColumnVisibilityState,
    PaginationState,
    SortingState,
} from '@tanstack/react-table';
import { useMemo, useState } from 'react';
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
import { BrandFormDialog } from '@/pages/brands/brand-form-dialog';
import { BrandStatusDialog } from '@/pages/brands/brand-status-dialog';
import {
    brandColumnLabels,
    brandTableFeatures,
    createBrandColumns,
} from '@/pages/brands/table-config';
import type { Brand } from '@/pages/brands/types';

type Props = {
    data: Brand[];
};

const initialSorting: SortingState = [{ id: 'number', desc: true }];
const initialPagination: PaginationState = {
    pageIndex: 0,
    pageSize: 10,
};
const initialColumnVisibility: ColumnVisibilityState = {
    created_at: false,
};

export function BrandDataTable({ data }: Props) {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
    const [statusBrand, setStatusBrand] = useState<Brand | null>(null);
    const [globalFilter, setGlobalFilter] = useState('');
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [sorting, setSorting] = useState<SortingState>(initialSorting);
    const [pagination, setPagination] =
        useState<PaginationState>(initialPagination);
    const [columnVisibility, setColumnVisibility] =
        useState<ColumnVisibilityState>(initialColumnVisibility);
    const columns = useMemo(
        () =>
            createBrandColumns({
                onEdit: setEditingBrand,
                onToggleStatus: setStatusBrand,
            }),
        [],
    );

    const table = useTable({
        features: brandTableFeatures,
        data,
        columns,
        getRowId: (row) => String(row.id),
        getColumnCanGlobalFilter: (column) =>
            ['name', 'slug'].includes(column.id),
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

    const search = globalFilter;
    const statusFilter = table.getColumn('is_active')?.getFilterValue() as
        boolean | undefined;
    const filteredCount = table.getFilteredRowModel().rows.length;
    const { pageIndex, pageSize } = pagination;
    const pageCount = Math.max(table.getPageCount(), 1);
    const hasFilters = search.length > 0 || statusFilter !== undefined;

    function resetFilters() {
        setGlobalFilter('');
        setColumnFilters([]);
        setPagination((current) => ({ ...current, pageIndex: 0 }));
    }

    return (
        <>
            <DataTableShell
                title="Data Merek"
                description={`${filteredCount} dari ${data.length} merek ditampilkan`}
                actions={
                    <Button onClick={() => setIsCreateOpen(true)}>
                        <PlusIcon className="size-4" />
                        Tambah Merek
                    </Button>
                }
                toolbar={
                    <DataTableToolbar
                        search={
                            <DataTableSearch
                                value={search}
                                onValueChange={(value) => {
                                    table.setGlobalFilter(value);
                                    table.setPageIndex(0);
                                }}
                                placeholder="Cari nama, slug, atau deskripsi..."
                                ariaLabel="Cari data merek"
                            />
                        }
                    >
                        <Select
                            value={
                                statusFilter === undefined
                                    ? 'all'
                                    : statusFilter
                                      ? 'active'
                                      : 'inactive'
                            }
                            onValueChange={(value) => {
                                table
                                    .getColumn('is_active')
                                    ?.setFilterValue(
                                        value === 'all'
                                            ? undefined
                                            : value === 'active',
                                    );
                                table.setPageIndex(0);
                            }}
                        >
                            <SelectTrigger className="w-40">
                                <SelectValue placeholder="Semua status" />
                            </SelectTrigger>
                            <SelectContent align="end">
                                <SelectItem value="all">
                                    Semua status
                                </SelectItem>
                                <SelectItem value="active">Aktif</SelectItem>
                                <SelectItem value="inactive">
                                    Tidak aktif
                                </SelectItem>
                            </SelectContent>
                        </Select>

                        <DataTableColumnVisibility
                            columns={table.getAllLeafColumns()}
                            labels={brandColumnLabels}
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
                    <Table className="min-w-225">
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
                                    title="Data merek tidak ditemukan"
                                    description="Ubah kata pencarian atau filter yang digunakan."
                                />
                            )}
                        </TableBody>
                    </Table>
                </div>
            </DataTableShell>

            <BrandFormDialog
                open={isCreateOpen}
                brand={null}
                onOpenChange={setIsCreateOpen}
            />
            <BrandFormDialog
                open={editingBrand !== null}
                brand={editingBrand}
                onOpenChange={(open) => {
                    if (!open) {
                        setEditingBrand(null);
                    }
                }}
            />
            <BrandStatusDialog
                brand={statusBrand}
                onOpenChange={(open) => {
                    if (!open) {
                        setStatusBrand(null);
                    }
                }}
            />
        </>
    );
}

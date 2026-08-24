import {
    CaretDoubleLeftIcon,
    CaretDoubleRightIcon,
    CaretLeftIcon,
    CaretRightIcon,
    ColumnsIcon,
    MagnifyingGlassIcon,
    PlusIcon,
    XIcon,
} from '@phosphor-icons/react';
import { useTable } from '@tanstack/react-table';
import type {
    ColumnFiltersState,
    ColumnVisibilityState,
    PaginationState,
    RowSelectionState,
    SortingState,
} from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
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
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
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
            rowSelection,
            columnVisibility,
        },
        onGlobalFilterChange: setGlobalFilter,
        onColumnFiltersChange: setColumnFilters,
        onSortingChange: setSorting,
        onPaginationChange: setPagination,
        onRowSelectionChange: setRowSelection,
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
    const selectedCount = table.getSelectedRowIds().length;
    const { pageIndex, pageSize } = pagination;
    const pageCount = Math.max(table.getPageCount(), 1);
    const firstVisibleRow = filteredCount === 0 ? 0 : pageIndex * pageSize + 1;
    const lastVisibleRow = Math.min((pageIndex + 1) * pageSize, filteredCount);
    const hasFilters = search.length > 0 || statusFilter !== undefined;

    function resetFilters() {
        setGlobalFilter('');
        setColumnFilters([]);
        setPagination((current) => ({ ...current, pageIndex: 0 }));
    }

    return (
        <>
            <Card className="min-w-0 gap-0 overflow-hidden py-0">
                <CardHeader className="gap-4 border-b px-4 py-5 sm:px-6">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <CardTitle>Data Merek</CardTitle>
                            <p className="text-sm text-muted-foreground">
                                {filteredCount} dari {data.length} merek
                                ditampilkan
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            {selectedCount > 0 && (
                                <p className="text-sm font-medium">
                                    {selectedCount} baris dipilih
                                </p>
                            )}
                            <Button onClick={() => setIsCreateOpen(true)}>
                                <PlusIcon className="size-4" />
                                Tambah Merek
                            </Button>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
                        <div className="relative flex-1 lg:max-w-sm">
                            <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={search}
                                onChange={(event) =>
                                    table.setGlobalFilter(event.target.value)
                                }
                                placeholder="Cari nama, slug, atau deskripsi..."
                                className="pl-9"
                                aria-label="Cari data merek"
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <Select
                                value={
                                    statusFilter === undefined
                                        ? 'all'
                                        : statusFilter
                                          ? 'active'
                                          : 'inactive'
                                }
                                onValueChange={(value) =>
                                    table
                                        .getColumn('is_active')
                                        ?.setFilterValue(
                                            value === 'all'
                                                ? undefined
                                                : value === 'active',
                                        )
                                }
                            >
                                <SelectTrigger className="w-40">
                                    <SelectValue placeholder="Semua status" />
                                </SelectTrigger>
                                <SelectContent align="end">
                                    <SelectItem value="all">
                                        Semua status
                                    </SelectItem>
                                    <SelectItem value="active">
                                        Aktif
                                    </SelectItem>
                                    <SelectItem value="inactive">
                                        Tidak aktif
                                    </SelectItem>
                                </SelectContent>
                            </Select>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline">
                                        <ColumnsIcon />
                                        Kolom
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    align="end"
                                    className="w-48"
                                >
                                    <DropdownMenuLabel>
                                        Tampilkan kolom
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {table
                                        .getAllLeafColumns()
                                        .filter((column) => column.getCanHide())
                                        .map((column) => (
                                            <DropdownMenuCheckboxItem
                                                key={column.id}
                                                checked={column.getIsVisible()}
                                                onCheckedChange={(value) =>
                                                    column.toggleVisibility(
                                                        value === true,
                                                    )
                                                }
                                            >
                                                {brandColumnLabels[column.id] ??
                                                    column.id}
                                            </DropdownMenuCheckboxItem>
                                        ))}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {hasFilters && (
                                <Button variant="ghost" onClick={resetFilters}>
                                    <XIcon />
                                    Reset
                                </Button>
                            )}
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-0">
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
                                        <TableRow
                                            key={row.id}
                                            data-state={
                                                row.getIsSelected()
                                                    ? 'selected'
                                                    : undefined
                                            }
                                        >
                                            {row
                                                .getVisibleCells()
                                                .map((cell) => (
                                                    <TableCell key={cell.id}>
                                                        <table.FlexRender
                                                            cell={cell}
                                                        />
                                                    </TableCell>
                                                ))}
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={
                                                table.getVisibleLeafColumns()
                                                    .length
                                            }
                                            className="h-32 text-center"
                                        >
                                            <div className="space-y-1">
                                                <p className="font-medium">
                                                    Data merek tidak ditemukan
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    Ubah kata pencarian atau
                                                    filter yang digunakan.
                                                </p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="flex flex-col gap-3 border-t px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
                        <p className="text-sm text-muted-foreground">
                            Menampilkan {firstVisibleRow}–{lastVisibleRow} dari{' '}
                            {filteredCount} data
                        </p>

                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-2">
                                <span className="text-sm">
                                    Baris per halaman
                                </span>
                                <Select
                                    value={String(pageSize)}
                                    onValueChange={(value) =>
                                        table.setPageSize(Number(value))
                                    }
                                >
                                    <SelectTrigger size="sm" className="w-18">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent
                                        align="end"
                                        className="min-w-18"
                                    >
                                        {[10, 20, 50].map((size) => (
                                            <SelectItem
                                                key={size}
                                                value={String(size)}
                                            >
                                                {size}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <span className="min-w-28 text-center text-sm font-medium">
                                Halaman {pageIndex + 1} dari {pageCount}
                            </span>

                            <div className="flex items-center gap-1">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="size-8"
                                    onClick={() => table.firstPage()}
                                    disabled={!table.getCanPreviousPage()}
                                    aria-label="Halaman pertama"
                                >
                                    <CaretDoubleLeftIcon />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="size-8"
                                    onClick={() => table.previousPage()}
                                    disabled={!table.getCanPreviousPage()}
                                    aria-label="Halaman sebelumnya"
                                >
                                    <CaretLeftIcon />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="size-8"
                                    onClick={() => table.nextPage()}
                                    disabled={!table.getCanNextPage()}
                                    aria-label="Halaman berikutnya"
                                >
                                    <CaretRightIcon />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="size-8"
                                    onClick={() => table.lastPage()}
                                    disabled={!table.getCanNextPage()}
                                    aria-label="Halaman terakhir"
                                >
                                    <CaretDoubleRightIcon />
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

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

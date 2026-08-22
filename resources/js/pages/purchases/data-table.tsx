import { Link } from '@inertiajs/react';
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
import PurchaseController from '@/actions/App/Http/Controllers/PurchaseController';
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
import { PurchaseDeleteDialog } from '@/pages/purchases/purchase-delete-dialog';
import { PurchaseDetailDialog } from '@/pages/purchases/purchase-detail-dialog';
import { PurchaseStatusDialog } from '@/pages/purchases/purchase-status-dialog';
import {
    createPurchaseColumns,
    purchaseColumnLabels,
    purchaseTableFeatures,
} from '@/pages/purchases/table-config';
import type { Purchase, PurchaseStatus } from '@/pages/purchases/types';

type Props = {
    data: Purchase[];
};

const initialSorting: SortingState = [{ id: 'number', desc: true }];
const initialPagination: PaginationState = {
    pageIndex: 0,
    pageSize: 10,
};
const initialColumnVisibility: ColumnVisibilityState = {
    created_at: false,
};

export function PurchaseDataTable({ data }: Props) {
    const [detailPurchase, setDetailPurchase] = useState<Purchase | null>(null);
    const [statusPurchase, setStatusPurchase] = useState<Purchase | null>(null);
    const [deletingPurchase, setDeletingPurchase] = useState<Purchase | null>(
        null,
    );
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
            createPurchaseColumns({
                onDetail: setDetailPurchase,
                onStatusChange: setStatusPurchase,
                onDelete: setDeletingPurchase,
            }),
        [],
    );

    const table = useTable({
        features: purchaseTableFeatures,
        data,
        columns,
        getRowId: (row) => String(row.id),
        getColumnCanGlobalFilter: (column) =>
            ['purchase_number', 'car'].includes(column.id),
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
    const statusFilter = table.getColumn('status')?.getFilterValue() as
        PurchaseStatus | undefined;
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
                            <CardTitle>Data Modal Mobil</CardTitle>
                            <p className="text-sm text-muted-foreground">
                                {filteredCount} dari {data.length} catatan modal
                                ditampilkan
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            {selectedCount > 0 && (
                                <p className="text-sm font-medium">
                                    {selectedCount} baris dipilih
                                </p>
                            )}
                            <Button asChild>
                                <Link href={PurchaseController.create()}>
                                    <PlusIcon />
                                    Tambah modal
                                </Link>
                            </Button>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 xl:flex-row xl:items-center">
                        <div className="relative flex-1 xl:max-w-sm">
                            <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={search}
                                onChange={(event) =>
                                    table.setGlobalFilter(event.target.value)
                                }
                                placeholder="Cari kode modal atau mobil..."
                                className="pl-9"
                                aria-label="Cari data modal mobil"
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <Select
                                value={statusFilter ?? 'all'}
                                onValueChange={(value) =>
                                    table
                                        .getColumn('status')
                                        ?.setFilterValue(
                                            value === 'all' ? undefined : value,
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
                                    <SelectItem value="draft">Draft</SelectItem>
                                    <SelectItem value="completed">
                                        Aktif
                                    </SelectItem>
                                    <SelectItem value="cancelled">
                                        Dibatalkan
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
                                    className="w-52"
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
                                                {purchaseColumnLabels[
                                                    column.id
                                                ] ?? column.id}
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
                    <div className="overflow-x-auto">
                        <Table className="min-w-275">
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
                                                    Data modal tidak ditemukan
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    Ubah pencarian atau filter
                                                    yang digunakan.
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

            <PurchaseDetailDialog
                open={detailPurchase !== null}
                purchase={detailPurchase}
                onOpenChange={(open) => {
                    if (!open) {
                        setDetailPurchase(null);
                    }
                }}
                onStatusChange={setStatusPurchase}
            />
            <PurchaseStatusDialog
                purchase={statusPurchase}
                onOpenChange={(open) => {
                    if (!open) {
                        setStatusPurchase(null);
                    }
                }}
            />
            <PurchaseDeleteDialog
                purchase={deletingPurchase}
                onOpenChange={(open) => {
                    if (!open) {
                        setDeletingPurchase(null);
                    }
                }}
            />
        </>
    );
}

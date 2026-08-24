import {
    CaretDoubleLeftIcon,
    CaretDoubleRightIcon,
    CaretLeftIcon,
    CaretRightIcon,
    ColumnsIcon,
    MagnifyingGlassIcon,
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
import {
    createHandoverColumns,
    handoverColumnLabels,
    handoverStatusOptions,
    handoverTableFeatures,
} from '@/pages/handovers/table-config';
import type { HandoverFilterStatus } from '@/pages/handovers/table-config';
import type { Sale } from '@/pages/sales/types';

type Props = {
    sales: Sale[];
    onManageHandover: (sale: Sale) => void;
};

const initialSorting: SortingState = [{ id: 'number', desc: true }];
const initialPagination: PaginationState = { pageIndex: 0, pageSize: 10 };
const initialColumnVisibility: ColumnVisibilityState = {};

export function HandoverDataTable({ sales, onManageHandover }: Props) {
    const [globalFilter, setGlobalFilter] = useState('');
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [sorting, setSorting] = useState<SortingState>(initialSorting);
    const [pagination, setPagination] =
        useState<PaginationState>(initialPagination);
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
    const [columnVisibility, setColumnVisibility] =
        useState<ColumnVisibilityState>(initialColumnVisibility);
    const columns = useMemo(
        () => createHandoverColumns(onManageHandover),
        [onManageHandover],
    );

    const table = useTable({
        features: handoverTableFeatures,
        data: sales,
        columns,
        getRowId: (row) => String(row.id),
        getColumnCanGlobalFilter: (column) =>
            ['transaction', 'customer'].includes(column.id),
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

    const statusFilter = table
        .getColumn('handover_status')
        ?.getFilterValue() as HandoverFilterStatus | undefined;
    const filteredCount = table.getFilteredRowModel().rows.length;
    const { pageIndex, pageSize } = pagination;
    const pageCount = Math.max(table.getPageCount(), 1);
    const firstRow = filteredCount === 0 ? 0 : pageIndex * pageSize + 1;
    const lastRow = Math.min((pageIndex + 1) * pageSize, filteredCount);
    const hasFilters = globalFilter.length > 0 || statusFilter !== undefined;

    function resetFilters() {
        setGlobalFilter('');
        setColumnFilters([]);
        setPagination((current) => ({ ...current, pageIndex: 0 }));
    }

    return (
        <Card className="min-w-0 gap-0 overflow-hidden py-0">
            <CardHeader className="gap-4 border-b px-4 py-5 sm:px-6">
                <div>
                    <CardTitle>Daftar Penyerahan Unit</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        {filteredCount} dari {sales.length} transaksi
                        ditampilkan
                    </p>
                </div>

                <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
                    <div className="relative flex-1 lg:max-w-sm">
                        <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={globalFilter}
                            onChange={(event) => {
                                table.setGlobalFilter(event.target.value);
                                table.setPageIndex(0);
                            }}
                            placeholder="Cari invoice, BAST, unit, atau customer..."
                            className="pl-9"
                            aria-label="Cari penyerahan unit"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Select
                            value={statusFilter ?? 'all'}
                            onValueChange={(value) => {
                                table
                                    .getColumn('handover_status')
                                    ?.setFilterValue(
                                        value === 'all' ? undefined : value,
                                    );
                                table.setPageIndex(0);
                            }}
                        >
                            <SelectTrigger className="w-52">
                                <SelectValue placeholder="Semua progres" />
                            </SelectTrigger>
                            <SelectContent align="end">
                                <SelectItem value="all">
                                    Semua progres
                                </SelectItem>
                                {handoverStatusOptions.map((option) => (
                                    <SelectItem
                                        key={option.value}
                                        value={option.value}
                                    >
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline">
                                    <ColumnsIcon />
                                    Kolom
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
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
                                            {handoverColumnLabels[column.id] ??
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
                <Table className="min-w-250">
                    <TableHeader className="bg-muted/40">
                        {table.getHeaderGroups().map((group) => (
                            <TableRow key={group.id}>
                                {group.headers.map((header) => (
                                    <TableHead key={header.id}>
                                        {header.isPlaceholder ? null : (
                                            <table.FlexRender header={header} />
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
                                        <TableCell
                                            key={cell.id}
                                            className="whitespace-normal"
                                        >
                                            <table.FlexRender cell={cell} />
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={
                                        table.getVisibleLeafColumns().length
                                    }
                                    className="h-32 text-center"
                                >
                                    <p className="font-medium">
                                        Data penyerahan tidak ditemukan
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Ubah pencarian atau filter progres.
                                    </p>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>

                <div className="flex flex-col gap-3 border-t px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
                    <p className="text-sm text-muted-foreground">
                        Menampilkan {firstRow}–{lastRow} dari {filteredCount}{' '}
                        data
                    </p>
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2">
                            <span className="text-sm">Baris per halaman</span>
                            <Select
                                value={String(pageSize)}
                                onValueChange={(value) =>
                                    table.setPageSize(Number(value))
                                }
                            >
                                <SelectTrigger size="sm" className="w-18">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent align="end" className="min-w-18">
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
    );
}

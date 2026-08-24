import {
    BankIcon,
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
import { FinanceCompanyDeleteDialog } from '@/pages/finance-companies/finance-company-delete-dialog';
import { FinanceCompanyFormDialog } from '@/pages/finance-companies/finance-company-form-dialog';
import { FinanceCompanyStatusDialog } from '@/pages/finance-companies/finance-company-status-dialog';
import {
    createFinanceCompanyColumns,
    financeCompanyColumnLabels,
    financeCompanyTableFeatures,
} from '@/pages/finance-companies/table-config';
import type { FinanceCompany } from '@/pages/finance-companies/types';

type Props = {
    data: FinanceCompany[];
};

const initialSorting: SortingState = [{ id: 'company', desc: false }];
const initialPagination: PaginationState = {
    pageIndex: 0,
    pageSize: 10,
};
const initialColumnVisibility: ColumnVisibilityState = {
    created_at: false,
};

export function FinanceCompanyDataTable({ data }: Props) {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingCompany, setEditingCompany] = useState<FinanceCompany | null>(
        null,
    );
    const [statusCompany, setStatusCompany] = useState<FinanceCompany | null>(
        null,
    );
    const [deleteCompany, setDeleteCompany] = useState<FinanceCompany | null>(
        null,
    );

    const [globalFilter, setGlobalFilter] = useState('');
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [sorting, setSorting] = useState<SortingState>(initialSorting);
    const [pagination, setPagination] =
        useState<PaginationState>(initialPagination);
    const [columnVisibility, setColumnVisibility] =
        useState<ColumnVisibilityState>(initialColumnVisibility);

    const columns = useMemo(
        () =>
            createFinanceCompanyColumns({
                onEdit: setEditingCompany,
                onToggleStatus: setStatusCompany,
                onDelete: setDeleteCompany,
            }),
        [],
    );

    const table = useTable({
        features: financeCompanyTableFeatures,
        data,
        columns,
        getRowId: (row) => String(row.id),
        getColumnCanGlobalFilter: (column) =>
            ['company', 'contact', 'notes'].includes(column.id),
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

    const statusFilter = table.getColumn('is_active')?.getFilterValue() as
        boolean | undefined;
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
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <CardTitle>Daftar Perusahaan Leasing</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            {filteredCount} dari {data.length} rekanan
                            ditampilkan
                        </p>
                    </div>

                    <Button onClick={() => setIsCreateOpen(true)}>
                        <PlusIcon className="size-4" />
                        Tambah Leasing
                    </Button>
                </div>

                <div className="flex flex-col gap-2 xl:flex-row xl:items-center">
                    <div className="relative flex-1 xl:max-w-sm">
                        <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={globalFilter}
                            onChange={(event) => {
                                table.setGlobalFilter(event.target.value);
                                table.setPageIndex(0);
                            }}
                            placeholder="Cari nama, kode, PIC, atau no HP..."
                            className="pl-9"
                            aria-label="Cari perusahaan leasing"
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

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline">
                                    <ColumnsIcon className="mr-1.5 size-4" />
                                    Kolom
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuLabel>
                                    Pilih kolom
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
                                                    Boolean(value),
                                                )
                                            }
                                        >
                                            {financeCompanyColumnLabels[
                                                column.id
                                            ] ?? column.id}
                                        </DropdownMenuCheckboxItem>
                                    ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {hasFilters && (
                            <Button variant="ghost" onClick={resetFilters}>
                                <XIcon className="mr-1 size-4" />
                                Reset
                            </Button>
                        )}
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <Table className="min-w-250">
                        <TableHeader className="bg-muted/40">
                            {table.getHeaderGroups().map((group) => (
                                <TableRow key={group.id}>
                                    {group.headers.map((header) => (
                                        <TableHead
                                            key={header.id}
                                            className="text-xs font-semibold whitespace-nowrap"
                                        >
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
                                        className="transition-colors hover:bg-muted/30"
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell
                                                key={cell.id}
                                                className="py-3.5 align-middle"
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
                                        <div className="mx-auto flex max-w-sm flex-col items-center gap-2">
                                            <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                                                <BankIcon className="size-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">
                                                    Perusahaan leasing tidak
                                                    ditemukan
                                                </p>
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    Ubah kata kunci atau filter,
                                                    atau tambahkan rekanan baru.
                                                </p>
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                <div className="flex flex-col gap-3 border-t px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
                    <p className="text-xs text-muted-foreground">
                        Menampilkan {firstRow}–{lastRow} dari {filteredCount}{' '}
                        data
                    </p>
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2">
                            <span className="text-xs">Baris per halaman</span>
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
                        <span className="min-w-24 text-center text-xs font-medium">
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
                                <CaretDoubleLeftIcon className="size-3.5" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                className="size-8"
                                onClick={() => table.previousPage()}
                                disabled={!table.getCanPreviousPage()}
                                aria-label="Halaman sebelumnya"
                            >
                                <CaretLeftIcon className="size-3.5" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                className="size-8"
                                onClick={() => table.nextPage()}
                                disabled={!table.getCanNextPage()}
                                aria-label="Halaman berikutnya"
                            >
                                <CaretRightIcon className="size-3.5" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                className="size-8"
                                onClick={() => table.lastPage()}
                                disabled={!table.getCanNextPage()}
                                aria-label="Halaman terakhir"
                            >
                                <CaretDoubleRightIcon className="size-3.5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </CardContent>

            <FinanceCompanyFormDialog
                open={isCreateOpen || editingCompany !== null}
                company={editingCompany}
                onOpenChange={(open) => {
                    if (!open) {
                        setIsCreateOpen(false);
                        setEditingCompany(null);
                    }
                }}
            />

            <FinanceCompanyStatusDialog
                company={statusCompany}
                onOpenChange={(open) => {
                    if (!open) {
                        setStatusCompany(null);
                    }
                }}
            />

            <FinanceCompanyDeleteDialog
                company={deleteCompany}
                onOpenChange={(open) => {
                    if (!open) {
                        setDeleteCompany(null);
                    }
                }}
            />
        </Card>
    );
}

import { Form, Link, router } from '@inertiajs/react';
import {
    ArrowsClockwiseIcon,
    CaretDoubleLeftIcon,
    CaretDoubleRightIcon,
    CaretLeftIcon,
    CaretRightIcon,
    CoinsIcon,
    ColumnsIcon,
    CreditCardIcon,
    HandCoinsIcon,
    HourglassMediumIcon,
    MagnifyingGlassIcon,
    MoneyIcon,
    PlusIcon,
    TrashIcon,
    WarningIcon,
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
import SaleController from '@/actions/App/Http/Controllers/SaleController';
import { StatCard } from '@/components/stat-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
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
import { Spinner } from '@/components/ui/spinner';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { PaymentDialog } from '@/pages/sales/payment-dialog';
import {
    createSaleColumns,
    saleColumnLabels,
    saleTableFeatures,
} from '@/pages/sales/table-config';
import type { PaymentType, Sale, SalesSummary, SaleStatus } from '@/pages/sales/types';
import { create as salesCreate } from '@/routes/sales';

type Props = {
    data: Sale[];
    summary: SalesSummary;
};

const initialSorting: SortingState = [{ id: 'number', desc: true }];
const initialPagination: PaginationState = {
    pageIndex: 0,
    pageSize: 10,
};
const initialColumnVisibility: ColumnVisibilityState = {
    created_at: false,
};

const currencyFormatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
});

export function SaleDataTable({ data, summary }: Props) {
    const [selectedSaleForPayment, setSelectedSaleForPayment] = useState<Sale | null>(null);
    const [deletingSale, setDeletingSale] = useState<Sale | null>(null);
    const [globalFilter, setGlobalFilter] = useState('');
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [sorting, setSorting] = useState<SortingState>(initialSorting);
    const [pagination, setPagination] = useState<PaginationState>(initialPagination);
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
    const [columnVisibility, setColumnVisibility] = useState<ColumnVisibilityState>(initialColumnVisibility);

    const columns = useMemo(
        () =>
            createSaleColumns({
                onShow: (sale) => router.visit(SaleController.show.url(sale.id)),
                onRecordPayment: (sale) => setSelectedSaleForPayment(sale),
                onDelete: (sale) => setDeletingSale(sale),
            }),
        [],
    );

    const table = useTable({
        features: saleTableFeatures,
        data,
        columns,
        getRowId: (row) => String(row.id),
        getColumnCanGlobalFilter: (column) =>
            ['invoice_number', 'car', 'customer'].includes(column.id),
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
    const statusFilter = table.getColumn('status')?.getFilterValue() as SaleStatus | undefined;
    const paymentTypeFilter = table.getColumn('payment_type')?.getFilterValue() as PaymentType | undefined;
    const filteredCount = table.getFilteredRowModel().rows.length;
    const selectedCount = table.getSelectedRowIds().length;
    const { pageIndex, pageSize } = pagination;
    const pageCount = Math.max(table.getPageCount(), 1);
    const firstVisibleRow = filteredCount === 0 ? 0 : pageIndex * pageSize + 1;
    const lastVisibleRow = Math.min((pageIndex + 1) * pageSize, filteredCount);
    const hasFilters = search.length > 0 || statusFilter !== undefined || paymentTypeFilter !== undefined;

    function resetFilters() {
        setGlobalFilter('');
        setColumnFilters([]);
        setPagination((current) => ({ ...current, pageIndex: 0 }));
    }

    return (
        <div className="space-y-6">
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Omzet Penjualan"
                    value={currencyFormatter.format(summary.total_turnover)}
                    icon={CoinsIcon}
                    variant="default"
                />
                <StatCard
                    title="Total Kas Diterima"
                    value={currencyFormatter.format(summary.total_collected)}
                    icon={HandCoinsIcon}
                    variant="success"
                />
                <StatCard
                    title="Sisa Piutang / Belum Cair"
                    value={currencyFormatter.format(summary.total_receivables)}
                    icon={HourglassMediumIcon}
                    variant="warning"
                />
                <StatCard
                    title="Bonus Leasing Diterima"
                    value={currencyFormatter.format(summary.total_bonus_collected)}
                    icon={CreditCardIcon}
                    variant="info"
                />
            </div>

            {/* Main Table Card */}
            <Card className="min-w-0 gap-0 overflow-hidden py-0">
                <CardHeader className="gap-4 border-b px-4 py-5 sm:px-6">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <CardTitle>Data Transaksi Penjualan</CardTitle>
                            <p className="text-sm text-muted-foreground">
                                {filteredCount} dari {data.length} transaksi penjualan ditampilkan
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            {selectedCount > 0 && (
                                <p className="text-sm font-medium">
                                    {selectedCount} baris dipilih
                                </p>
                            )}
                            <Button asChild>
                                <Link href={salesCreate.url()}>
                                    <PlusIcon className="size-4" />
                                    Tambah Penjualan
                                </Link>
                            </Button>
                        </div>
                    </div>

                    {/* Filter & Search Bar */}
                    <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
                        <div className="relative flex-1 lg:max-w-sm">
                            <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={search}
                                onChange={(event) => table.setGlobalFilter(event.target.value)}
                                placeholder="Cari invoice, mobil, customer..."
                                className="pl-9"
                                aria-label="Cari transaksi penjualan"
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            {/* Filter Status */}
                            <Select
                                value={statusFilter ?? 'all'}
                                onValueChange={(value) =>
                                    table.getColumn('status')?.setFilterValue(value === 'all' ? undefined : value)
                                }
                            >
                                <SelectTrigger className="w-44">
                                    <SelectValue placeholder="Semua status" />
                                </SelectTrigger>
                                <SelectContent align="end">
                                    <SelectItem value="all">Semua status</SelectItem>
                                    <SelectItem value="completed">Lunas / Selesai</SelectItem>
                                    <SelectItem value="partial">Tempo / Piutang</SelectItem>
                                    <SelectItem value="pending">Booking / Menunggu</SelectItem>
                                    <SelectItem value="cancelled">Dibatalkan</SelectItem>
                                </SelectContent>
                            </Select>

                            {/* Filter Payment Type */}
                            <Select
                                value={paymentTypeFilter ?? 'all'}
                                onValueChange={(value) =>
                                    table.getColumn('payment_type')?.setFilterValue(value === 'all' ? undefined : value)
                                }
                            >
                                <SelectTrigger className="w-40">
                                    <SelectValue placeholder="Semua skema" />
                                </SelectTrigger>
                                <SelectContent align="end">
                                    <SelectItem value="all">Semua skema</SelectItem>
                                    <SelectItem value="cash_full">Tunai Lunas</SelectItem>
                                    <SelectItem value="cash_tempo">Tunai Tempo</SelectItem>
                                    <SelectItem value="credit">Kredit Leasing</SelectItem>
                                </SelectContent>
                            </Select>

                            {/* Column visibility */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline">
                                        <ColumnsIcon />
                                        Kolom
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuLabel>Tampilkan kolom</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {table
                                        .getAllLeafColumns()
                                        .filter((column) => column.getCanHide())
                                        .map((column) => (
                                            <DropdownMenuCheckboxItem
                                                key={column.id}
                                                checked={column.getIsVisible()}
                                                onCheckedChange={(value) =>
                                                    column.toggleVisibility(value === true)
                                                }
                                            >
                                                {saleColumnLabels[column.id] ?? column.id}
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
                        <Table className="min-w-320">
                            <TableHeader className="bg-muted/40">
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <TableRow key={headerGroup.id}>
                                        {headerGroup.headers.map((header) => (
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
                                        <TableRow
                                            key={row.id}
                                            data-state={row.getIsSelected() ? 'selected' : undefined}
                                        >
                                            {row.getVisibleCells().map((cell) => (
                                                <TableCell key={cell.id}>
                                                    <table.FlexRender cell={cell} />
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={table.getVisibleLeafColumns().length}
                                            className="h-32 text-center"
                                        >
                                            <div className="space-y-1">
                                                <p className="font-medium">Transaksi penjualan tidak ditemukan</p>
                                                <p className="text-sm text-muted-foreground">
                                                    Ubah kata pencarian atau filter yang digunakan.
                                                </p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    <div className="flex flex-col gap-3 border-t px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
                        <p className="text-sm text-muted-foreground">
                            Menampilkan {firstVisibleRow}–{lastVisibleRow} dari {filteredCount} data
                        </p>

                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-2">
                                <span className="text-sm">Baris per halaman</span>
                                <Select
                                    value={String(pageSize)}
                                    onValueChange={(value) => table.setPageSize(Number(value))}
                                >
                                    <SelectTrigger size="sm" className="w-18">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent align="end" className="min-w-18">
                                        {[10, 20, 50].map((size) => (
                                            <SelectItem key={size} value={String(size)}>
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

            {/* Quick Record Payment Dialog */}
            <PaymentDialog
                open={selectedSaleForPayment !== null}
                sale={selectedSaleForPayment}
                onOpenChange={(open) => {
                    if (!open) setSelectedSaleForPayment(null);
                }}
            />

            {/* Cancel / Delete Sale Dialog */}
            <Dialog open={deletingSale !== null} onOpenChange={(open) => { if (!open) setDeletingSale(null); }}>
                <DialogContent>
                    <DialogHeader>
                        <div className="mb-1 flex size-10 items-center justify-center rounded-full bg-red-500/10 text-red-500">
                            <WarningIcon className="size-5" weight="fill" />
                        </div>
                        <DialogTitle>Batalkan Transaksi Penjualan?</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin membatalkan transaksi invoice{' '}
                            <strong>{deletingSale?.invoice_number}</strong> ({deletingSale?.car?.name})?
                            Unit mobil akan otomatis dikembalikan menjadi <strong>Tersedia</strong>.
                        </DialogDescription>
                    </DialogHeader>

                    {deletingSale && (
                        <Form
                            action={SaleController.destroy.url(deletingSale.id)}
                            method="delete"
                            options={{ preserveScroll: true }}
                            onSuccess={() => setDeletingSale(null)}
                        >
                            {({ processing }) => (
                                <DialogFooter>
                                    <DialogClose asChild>
                                        <Button type="button" variant="outline" disabled={processing}>
                                            Batal
                                        </Button>
                                    </DialogClose>
                                    <Button
                                        type="submit"
                                        variant="destructive"
                                        disabled={processing}
                                    >
                                        {processing ? <Spinner /> : <TrashIcon />}
                                        Ya, Batalkan Penjualan
                                    </Button>
                                </DialogFooter>
                            )}
                        </Form>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

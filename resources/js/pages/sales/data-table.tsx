import { Form, Link, router } from '@inertiajs/react';
import {
    CoinsIcon,
    CreditCardIcon,
    HandCoinsIcon,
    HourglassMediumIcon,
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
    SortingState,
} from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import SaleController from '@/actions/App/Http/Controllers/SaleController';
import { DataTableColumnVisibility } from '@/components/data-table/data-table-column-visibility';
import { DataTableEmptyState } from '@/components/data-table/data-table-empty-state';
import { DataTablePagination } from '@/components/data-table/data-table-pagination';
import { DataTableSearch } from '@/components/data-table/data-table-search';
import { DataTableShell } from '@/components/data-table/data-table-shell';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { StatCard } from '@/components/stat-card';
import { Button } from '@/components/ui/button';
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
import type {
    PaymentType,
    Sale,
    SalesSummary,
    SaleStatus,
} from '@/pages/sales/types';
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
    const [selectedSaleForPayment, setSelectedSaleForPayment] =
        useState<Sale | null>(null);
    const [deletingSale, setDeletingSale] = useState<Sale | null>(null);
    const [globalFilter, setGlobalFilter] = useState('');
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [sorting, setSorting] = useState<SortingState>(initialSorting);
    const [pagination, setPagination] =
        useState<PaginationState>(initialPagination);
    const [columnVisibility, setColumnVisibility] =
        useState<ColumnVisibilityState>(initialColumnVisibility);

    const columns = useMemo(
        () =>
            createSaleColumns({
                onShow: (sale) =>
                    router.visit(SaleController.show.url(sale.id)),
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
    const statusFilter = table.getColumn('status')?.getFilterValue() as
        SaleStatus | undefined;
    const paymentTypeFilter = table
        .getColumn('payment_type')
        ?.getFilterValue() as PaymentType | undefined;
    const filteredCount = table.getFilteredRowModel().rows.length;
    const { pageIndex, pageSize } = pagination;
    const pageCount = Math.max(table.getPageCount(), 1);
    const hasFilters =
        search.length > 0 ||
        statusFilter !== undefined ||
        paymentTypeFilter !== undefined;

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
                    value={currencyFormatter.format(
                        summary.total_bonus_collected,
                    )}
                    icon={CreditCardIcon}
                    variant="info"
                />
            </div>

            <DataTableShell
                title="Data Transaksi Penjualan"
                description={`${filteredCount} dari ${data.length} transaksi penjualan ditampilkan`}
                actions={
                    <Button asChild>
                        <Link href={salesCreate.url()}>
                            <PlusIcon className="size-4" />
                            Tambah Penjualan
                        </Link>
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
                                placeholder="Cari invoice, mobil, customer..."
                                ariaLabel="Cari transaksi penjualan"
                            />
                        }
                    >
                        {/* Filter Status */}
                        <Select
                            value={statusFilter ?? 'all'}
                            onValueChange={(value) => {
                                table
                                    .getColumn('status')
                                    ?.setFilterValue(
                                        value === 'all' ? undefined : value,
                                    );
                                table.setPageIndex(0);
                            }}
                        >
                            <SelectTrigger className="w-44">
                                <SelectValue placeholder="Semua status" />
                            </SelectTrigger>
                            <SelectContent align="end">
                                <SelectItem value="all">
                                    Semua status
                                </SelectItem>
                                <SelectItem value="completed">
                                    Lunas / Selesai
                                </SelectItem>
                                <SelectItem value="partial">
                                    Tempo / Piutang
                                </SelectItem>
                                <SelectItem value="pending">
                                    Booking / Menunggu
                                </SelectItem>
                                <SelectItem value="cancelled">
                                    Dibatalkan
                                </SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Filter Payment Type */}
                        <Select
                            value={paymentTypeFilter ?? 'all'}
                            onValueChange={(value) => {
                                table
                                    .getColumn('payment_type')
                                    ?.setFilterValue(
                                        value === 'all' ? undefined : value,
                                    );
                                table.setPageIndex(0);
                            }}
                        >
                            <SelectTrigger className="w-40">
                                <SelectValue placeholder="Semua skema" />
                            </SelectTrigger>
                            <SelectContent align="end">
                                <SelectItem value="all">Semua skema</SelectItem>
                                <SelectItem value="cash_full">
                                    Tunai Lunas
                                </SelectItem>
                                <SelectItem value="cash_tempo">
                                    Tunai Tempo
                                </SelectItem>
                                <SelectItem value="credit">
                                    Kredit Leasing
                                </SelectItem>
                                <SelectItem value="trade_in">
                                    Tukar Tambah
                                </SelectItem>
                            </SelectContent>
                        </Select>

                        <DataTableColumnVisibility
                            columns={table.getAllLeafColumns()}
                            labels={saleColumnLabels}
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
                    <Table className="min-w-320">
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
                                    title="Transaksi penjualan tidak ditemukan"
                                    description="Ubah kata pencarian atau filter yang digunakan."
                                />
                            )}
                        </TableBody>
                    </Table>
                </div>
            </DataTableShell>

            {/* Quick Record Payment Dialog */}
            <PaymentDialog
                open={selectedSaleForPayment !== null}
                sale={selectedSaleForPayment}
                onOpenChange={(open) => {
                    if (!open) {
                        setSelectedSaleForPayment(null);
                    }
                }}
            />

            {/* Cancel / Delete Sale Dialog */}
            <Dialog
                open={deletingSale !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setDeletingSale(null);
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <div className="mb-1 flex size-10 items-center justify-center rounded-full bg-red-500/10 text-red-500">
                            <WarningIcon className="size-5" weight="fill" />
                        </div>
                        <DialogTitle>Batalkan Transaksi Penjualan?</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin membatalkan transaksi
                            invoice{' '}
                            <strong>{deletingSale?.invoice_number}</strong> (
                            {deletingSale?.car?.name})? Unit mobil akan otomatis
                            dikembalikan menjadi <strong>Tersedia</strong>.
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
                                        <Button
                                            type="button"
                                            variant="outline"
                                            disabled={processing}
                                        >
                                            Batal
                                        </Button>
                                    </DialogClose>
                                    <Button
                                        type="submit"
                                        variant="destructive"
                                        disabled={processing}
                                    >
                                        {processing ? (
                                            <Spinner />
                                        ) : (
                                            <TrashIcon />
                                        )}
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

import { Link, router } from '@inertiajs/react';
import {
    CoinsIcon,
    CreditCardIcon,
    HandCoinsIcon,
    HourglassMediumIcon,
    PlusIcon,
    TrashIcon,
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
import { ConfirmDialog } from '@/components/confirm-dialog';
import { DataTableColumnVisibility } from '@/components/data-table/data-table-column-visibility';
import { DataTableEmptyState } from '@/components/data-table/data-table-empty-state';
import { DataTablePagination } from '@/components/data-table/data-table-pagination';
import { DataTableSearch } from '@/components/data-table/data-table-search';
import { DataTableShell } from '@/components/data-table/data-table-shell';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { DateRangeFilter } from '@/components/date-range-filter';
import { StatCard } from '@/components/stat-card';
import { StatCardGrid } from '@/components/stat-card-grid';
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
import type { DatePreset } from '@/lib/formatters';
import {
    formatCurrency,
    getPresetDateRange,
    isDateInRange,
} from '@/lib/formatters';
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
    const [datePreset, setDatePreset] = useState<DatePreset>('all');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');

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

    const filteredByDateData = useMemo(() => {
        if (datePreset === 'all') {
            return data;
        }

        const { start, end } = getPresetDateRange(
            datePreset,
            customStartDate,
            customEndDate,
        );

        if (!start && !end) {
            return data;
        }

        return data.filter((sale) =>
            isDateInRange(sale.created_at, start, end),
        );
    }, [data, datePreset, customStartDate, customEndDate]);

    const table = useTable({
        features: saleTableFeatures,
        data: filteredByDateData,
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
    const isDateFiltered =
        datePreset !== 'all' &&
        (datePreset !== 'custom' ||
            customStartDate !== '' ||
            customEndDate !== '');
    const hasFilters =
        search.length > 0 ||
        statusFilter !== undefined ||
        paymentTypeFilter !== undefined ||
        isDateFiltered;

    const filteredRows = table.getFilteredRowModel().rows;
    const activeSummary = useMemo(() => {
        if (!hasFilters) {
            return summary;
        }

        const items = filteredRows.map((r) => r.original);

        return {
            total_turnover: items.reduce(
                (acc, s) => acc + (s.deal_price ?? 0),
                0,
            ),
            total_collected: items.reduce(
                (acc, s) => acc + (s.total_paid ?? 0),
                0,
            ),
            total_receivables: items.reduce(
                (acc, s) => acc + (s.remaining_bill ?? 0),
                0,
            ),
            total_bonus_collected: items.reduce(
                (acc, s) => acc + (s.total_bonus_paid ?? 0),
                0,
            ),
            pending_disbursements_count: items.filter(
                (s) => s.payment_type === 'credit' && s.status !== 'completed',
            ).length,
        };
    }, [filteredRows, hasFilters, summary]);

    function resetFilters() {
        setGlobalFilter('');
        setColumnFilters([]);
        setDatePreset('all');
        setCustomStartDate('');
        setCustomEndDate('');
        setPagination((current) => ({ ...current, pageIndex: 0 }));
    }

    return (
        <div className="space-y-6">
            <StatCardGrid>
                <StatCard
                    title="Total Omzet Penjualan"
                    value={formatCurrency(activeSummary.total_turnover)}
                    icon={CoinsIcon}
                    variant="default"
                />
                <StatCard
                    title="Total Kas Diterima"
                    value={formatCurrency(activeSummary.total_collected)}
                    icon={HandCoinsIcon}
                    variant="success"
                />
                <StatCard
                    title="Sisa Piutang / Belum Cair"
                    value={formatCurrency(activeSummary.total_receivables)}
                    icon={HourglassMediumIcon}
                    variant="warning"
                />
                <StatCard
                    title="Bonus Leasing Diterima"
                    value={formatCurrency(activeSummary.total_bonus_collected)}
                    icon={CreditCardIcon}
                    variant="info"
                />
            </StatCardGrid>

            <DateRangeFilter
                datePreset={datePreset}
                onDatePresetChange={(val) => {
                    setDatePreset(val);
                    table.setPageIndex(0);
                }}
                customStartDate={customStartDate}
                onCustomStartDateChange={(val) => {
                    setCustomStartDate(val);
                    table.setPageIndex(0);
                }}
                customEndDate={customEndDate}
                onCustomEndDateChange={(val) => {
                    setCustomEndDate(val);
                    table.setPageIndex(0);
                }}
                onReset={isDateFiltered ? resetFilters : undefined}
            />

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
                footer={<DataTablePagination table={table} />}
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
            <ConfirmDialog
                open={deletingSale !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setDeletingSale(null);
                    }
                }}
                tone="danger"
                title="Batalkan Transaksi Penjualan?"
                description={
                    <>
                        Apakah Anda yakin ingin membatalkan transaksi invoice{' '}
                        <strong>{deletingSale?.invoice_number}</strong> (
                        {deletingSale?.car?.name})? Unit mobil akan otomatis
                        dikembalikan menjadi <strong>Tersedia</strong>.
                    </>
                }
                confirmText="Ya, Batalkan Penjualan"
                confirmIcon={TrashIcon}
                formProps={
                    deletingSale
                        ? {
                              action: SaleController.destroy.url(
                                  deletingSale.id,
                              ),
                              method: 'delete',
                              options: { preserveScroll: true },
                              onSuccess: () => setDeletingSale(null),
                          }
                        : undefined
                }
            />
        </div>
    );
}

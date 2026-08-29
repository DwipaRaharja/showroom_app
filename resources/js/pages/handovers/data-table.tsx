import { XIcon } from '@phosphor-icons/react';
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
import { DateRangeFilter } from '@/components/date-range-filter';
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
import { getPresetDateRange, isDateInRange } from '@/lib/formatters';
import {
    createHandoverColumns,
    createHandoverRecords,
    handoverColumnLabels,
    handoverStatusOptions,
    handoverTableFeatures,
} from '@/pages/handovers/table-config';
import type { HandoverFilterStatus } from '@/pages/handovers/table-config';
import type { Sale } from '@/pages/sales/types';

type Props = {
    sales: Sale[];
};

const initialSorting: SortingState = [{ id: 'number', desc: true }];
const initialPagination: PaginationState = { pageIndex: 0, pageSize: 10 };
const initialColumnVisibility: ColumnVisibilityState = {};

export function HandoverDataTable({ sales }: Props) {
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

    const columns = useMemo(() => createHandoverColumns(), []);
    const records = useMemo(() => createHandoverRecords(sales), [sales]);

    const filteredRecords = useMemo(() => {
        if (datePreset === 'all') {
            return records;
        }

        const { start, end } = getPresetDateRange(
            datePreset,
            customStartDate,
            customEndDate,
        );

        if (!start && !end) {
            return records;
        }

        return records.filter((record) =>
            isDateInRange(
                record.latestEvent?.occurred_at ||
                    record.handover?.created_at ||
                    record.sale.created_at,
                start,
                end,
            ),
        );
    }, [records, datePreset, customStartDate, customEndDate]);

    const table = useTable({
        features: handoverTableFeatures,
        data: filteredRecords,
        columns,
        getRowId: (row) => String(row.id),
        getColumnCanGlobalFilter: (column) =>
            ['transaction', 'summary', 'items', 'recipient'].includes(
                column.id,
            ),
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

    const statusFilter = table.getColumn('status')?.getFilterValue() as
        HandoverFilterStatus | undefined;
    const filteredCount = table.getFilteredRowModel().rows.length;
    const isDateFiltered =
        datePreset !== 'all' &&
        (datePreset !== 'custom' ||
            customStartDate !== '' ||
            customEndDate !== '');
    const hasFilters =
        globalFilter.length > 0 || statusFilter !== undefined || isDateFiltered;

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
                title="Penyerahan per Penjualan"
                description={`${filteredCount} dari ${records.length} penjualan ditampilkan sebagai satu baris per transaksi`}
                toolbar={
                    <DataTableToolbar
                        search={
                            <DataTableSearch
                                value={globalFilter}
                                onValueChange={(value) => {
                                    table.setGlobalFilter(value);
                                    table.setPageIndex(0);
                                }}
                                placeholder="Cari transaksi, mobil, plat, customer..."
                                ariaLabel="Cari data penyerahan unit"
                            />
                        }
                    >
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
                            <SelectTrigger className="w-48">
                                <SelectValue placeholder="Semua status" />
                            </SelectTrigger>
                            <SelectContent align="end">
                                <SelectItem value="all">
                                    Semua status
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

                        <DataTableColumnVisibility
                            columns={table.getAllLeafColumns()}
                            labels={handoverColumnLabels}
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
                    <Table className="min-w-240">
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
                                    title="Data penyerahan tidak ditemukan"
                                    description="Ubah pencarian atau filter untuk menemukan penjualan."
                                />
                            )}
                        </TableBody>
                    </Table>
                </div>
            </DataTableShell>
        </div>
    );
}

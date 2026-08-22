import {
    CaretLeftIcon,
    CaretRightIcon,
    MagnifyingGlassIcon,
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
import { Input } from '@/components/ui/input';
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
    handoverTableFeatures,
} from '@/pages/handovers/table-config';
import type { Sale } from '@/pages/sales/types';

type Props = {
    sales: Sale[];
    onManageHandover: (sale: Sale) => void;
};

export function HandoverDataTable({ sales, onManageHandover }: Props) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<ColumnVisibilityState>({});
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: 10,
    });
    const [statusFilter, setStatusFilter] = useState<'all' | 'ready' | 'delivered' | 'completed' | 'locked'>('all');

    const filteredData = useMemo(() => {
        return sales.filter((sale) => {
            const remaining = sale.remaining_bill ?? 0;
            const canDeliver = sale.can_deliver_vehicle ?? (remaining <= 10_000_000);
            const isVehicleDelivered = Boolean(sale.handover?.vehicle_delivered_at);
            const isBpkbDelivered = Boolean(sale.handover?.bpkb_delivered_at);

            if (statusFilter === 'ready') {
                return canDeliver && !isVehicleDelivered;
            }
            if (statusFilter === 'delivered') {
                return isVehicleDelivered && !isBpkbDelivered;
            }
            if (statusFilter === 'completed') {
                return isBpkbDelivered;
            }
            if (statusFilter === 'locked') {
                return !canDeliver;
            }
            return true;
        });
    }, [sales, statusFilter]);

    const columns = useMemo(
        () => createHandoverColumns(onManageHandover),
        [onManageHandover],
    );

    const table = useTable({
        features: handoverTableFeatures,
        data: filteredData,
        columns,
        getRowId: (row) => String(row.id),
        state: {
            sorting,
            globalFilter,
            columnFilters,
            columnVisibility,
            rowSelection,
            pagination,
        },
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        onPaginationChange: setPagination,
    });

    const pageCount = table.getPageCount();
    const { pageIndex } = pagination;

    return (
        <div className="space-y-4">
            {/* Filter and Search toolbar */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative max-w-sm flex-1">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Cari SPK, mobil, customer, atau BAST..."
                        value={globalFilter ?? ''}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                        className="pl-9 text-xs"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                    <Button
                        type="button"
                        variant={statusFilter === 'all' ? 'default' : 'outline'}
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => setStatusFilter('all')}
                    >
                        Semua ({sales.length})
                    </Button>
                    <Button
                        type="button"
                        variant={statusFilter === 'ready' ? 'default' : 'outline'}
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => setStatusFilter('ready')}
                    >
                        Siap Serah Unit
                    </Button>
                    <Button
                        type="button"
                        variant={statusFilter === 'delivered' ? 'default' : 'outline'}
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => setStatusFilter('delivered')}
                    >
                        Unit Diserahkan (BPKB Tahan)
                    </Button>
                    <Button
                        type="button"
                        variant={statusFilter === 'completed' ? 'default' : 'outline'}
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => setStatusFilter('completed')}
                    >
                        Selesai Lengkap
                    </Button>
                </div>
            </div>

            {/* Table Container */}
            <div className="rounded-xl border bg-card shadow-xs overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/40">
                        {table.getHeaderGroups().map((group) => (
                            <TableRow key={group.id}>
                                {group.headers.map((header) => (
                                    <TableHead key={header.id} className="text-xs font-bold">
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
                                        <TableCell key={cell.id} className="py-3">
                                            <table.FlexRender cell={cell} />
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-32 text-center text-xs text-muted-foreground"
                                >
                                    Tidak ada data transaksi penyerahan kendaraan yang sesuai filter.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination Controls */}
            {pageCount > 1 && (
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div>
                        Menampilkan {table.getRowModel().rows.length} dari {filteredData.length} data
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                        >
                            <CaretLeftIcon className="size-4 mr-1" />
                            Sebelumnya
                        </Button>
                        <span>
                            Halaman {pageIndex + 1} dari {pageCount}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                        >
                            Berikutnya
                            <CaretRightIcon className="size-4 ml-1" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

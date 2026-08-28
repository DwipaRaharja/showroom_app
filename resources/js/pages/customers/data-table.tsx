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
import { CustomerDetailDialog } from '@/pages/customers/customer-detail-dialog';
import { CustomerFormDialog } from '@/pages/customers/customer-form-dialog';
import { CustomerStatusDialog } from '@/pages/customers/customer-status-dialog';
import {
    customerColumnLabels,
    customerTableFeatures,
    createCustomerColumns,
} from '@/pages/customers/table-config';
import type { Customer } from '@/pages/customers/types';

type Props = {
    data: Customer[];
};

const initialSorting: SortingState = [{ id: 'number', desc: true }];
const initialPagination: PaginationState = {
    pageIndex: 0,
    pageSize: 10,
};
const initialColumnFilters: ColumnFiltersState = [
    { id: 'is_archived', value: false },
];
const initialColumnVisibility: ColumnVisibilityState = {
    created_at: false,
};

export function CustomerDataTable({ data }: Props) {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(
        null,
    );
    const [detailCustomer, setDetailCustomer] = useState<Customer | null>(null);
    const [statusCustomer, setStatusCustomer] = useState<Customer | null>(null);
    const [globalFilter, setGlobalFilter] = useState('');
    const [columnFilters, setColumnFilters] =
        useState<ColumnFiltersState>(initialColumnFilters);
    const [sorting, setSorting] = useState<SortingState>(initialSorting);
    const [pagination, setPagination] =
        useState<PaginationState>(initialPagination);
    const [columnVisibility, setColumnVisibility] =
        useState<ColumnVisibilityState>(initialColumnVisibility);

    const columns = useMemo(
        () =>
            createCustomerColumns({
                onDetail: setDetailCustomer,
                onEdit: setEditingCustomer,
                onChangeStatus: setStatusCustomer,
            }),
        [],
    );

    const table = useTable({
        features: customerTableFeatures,
        data,
        columns,
        getRowId: (row) => String(row.id),
        getColumnCanGlobalFilter: (column) =>
            ['name', 'phone', 'ktp_number', 'address'].includes(column.id),
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
    const archiveFilter = table.getColumn('is_archived')?.getFilterValue() as
        boolean | undefined;
    const filteredCount = table.getFilteredRowModel().rows.length;
    const hasFilters = search.length > 0 || archiveFilter !== false;

    function resetFilters() {
        setGlobalFilter('');
        setColumnFilters(initialColumnFilters);
        setPagination((current) => ({ ...current, pageIndex: 0 }));
    }

    return (
        <>
            <DataTableShell
                title="Data Customer"
                description={`${filteredCount} dari ${data.length} customer ditampilkan`}
                actions={
                    <Button onClick={() => setIsCreateOpen(true)}>
                        <PlusIcon className="size-4" />
                        Tambah Customer
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
                                placeholder="Cari nama, telepon, NIK, alamat..."
                                ariaLabel="Cari data customer"
                            />
                        }
                    >
                        <Select
                            value={
                                archiveFilter === undefined
                                    ? 'all'
                                    : archiveFilter
                                      ? 'archived'
                                      : 'active'
                            }
                            onValueChange={(value) => {
                                table
                                    .getColumn('is_archived')
                                    ?.setFilterValue(
                                        value === 'all'
                                            ? undefined
                                            : value === 'archived',
                                    );
                                table.setPageIndex(0);
                            }}
                        >
                            <SelectTrigger className="w-40">
                                <SelectValue placeholder="Status data" />
                            </SelectTrigger>
                            <SelectContent align="end">
                                <SelectItem value="active">
                                    Customer aktif
                                </SelectItem>
                                <SelectItem value="archived">
                                    Diarsipkan
                                </SelectItem>
                                <SelectItem value="all">
                                    Semua status
                                </SelectItem>
                            </SelectContent>
                        </Select>

                        <DataTableColumnVisibility
                            columns={table.getAllLeafColumns()}
                            labels={customerColumnLabels}
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
                                    title="Data customer tidak ditemukan"
                                    description="Ubah kata pencarian atau filter yang digunakan."
                                />
                            )}
                        </TableBody>
                    </Table>
                </div>
            </DataTableShell>

            <CustomerDetailDialog
                open={detailCustomer !== null}
                customer={detailCustomer}
                onOpenChange={(open) => {
                    if (!open) {
                        setDetailCustomer(null);
                    }
                }}
                onEdit={setEditingCustomer}
            />
            <CustomerFormDialog
                open={isCreateOpen}
                customer={null}
                onOpenChange={setIsCreateOpen}
            />
            <CustomerFormDialog
                open={editingCustomer !== null}
                customer={editingCustomer}
                onOpenChange={(open) => {
                    if (!open) {
                        setEditingCustomer(null);
                    }
                }}
            />
            <CustomerStatusDialog
                customer={statusCustomer}
                onOpenChange={(open) => {
                    if (!open) {
                        setStatusCustomer(null);
                    }
                }}
            />
        </>
    );
}

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

const initialSorting: SortingState = [{ id: 'number', desc: true }];
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
    const hasFilters = globalFilter.length > 0 || statusFilter !== undefined;

    function resetFilters() {
        setGlobalFilter('');
        setColumnFilters([]);
        setPagination((current) => ({ ...current, pageIndex: 0 }));
    }

    return (
        <>
            <DataTableShell
                title="Daftar Perusahaan Leasing"
                description={`${filteredCount} dari ${data.length} rekanan ditampilkan`}
                actions={
                    <Button onClick={() => setIsCreateOpen(true)}>
                        <PlusIcon className="size-4" />
                        Tambah Leasing
                    </Button>
                }
                toolbar={
                    <DataTableToolbar
                        search={
                            <DataTableSearch
                                value={globalFilter}
                                onValueChange={(value) => {
                                    table.setGlobalFilter(value);
                                    table.setPageIndex(0);
                                }}
                                placeholder="Cari nama, kode, PIC, atau no HP..."
                                ariaLabel="Cari perusahaan leasing"
                            />
                        }
                    >
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

                        <DataTableColumnVisibility
                            columns={table.getAllLeafColumns()}
                            labels={financeCompanyColumnLabels}
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
                    <Table className="min-w-250">
                        <TableHeader className="bg-muted/40">
                            {table.getHeaderGroups().map((group) => (
                                <TableRow key={group.id}>
                                    {group.headers.map((header) => (
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
                                    title="Perusahaan leasing tidak ditemukan"
                                    description="Ubah kata pencarian atau filter yang digunakan."
                                />
                            )}
                        </TableBody>
                    </Table>
                </div>
            </DataTableShell>

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
        </>
    );
}

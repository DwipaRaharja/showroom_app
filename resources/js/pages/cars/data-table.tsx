import { Link } from '@inertiajs/react';
import { PlusIcon, XIcon } from '@phosphor-icons/react';
import { useTable } from '@tanstack/react-table';
import type {
    ColumnFiltersState,
    ColumnVisibilityState,
    PaginationState,
    SortingState,
} from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import CarController from '@/actions/App/Http/Controllers/CarController';
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
import { CarDeleteDialog } from '@/pages/cars/car-delete-dialog';
import { CarRestoreDialog } from '@/pages/cars/car-restore-dialog';
import { CarStatusDialog } from '@/pages/cars/car-status-dialog';
import {
    carColumnLabels,
    carTableFeatures,
    createCarColumns,
} from '@/pages/cars/table-config';
import type { Car, CarStatus, VehicleDocumentState } from '@/pages/cars/types';
import { VehicleDocumentsDialog } from '@/pages/cars/vehicle-documents-dialog';

type Props = {
    data: Car[];
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

export function CarDataTable({ data }: Props) {
    const [statusCar, setStatusCar] = useState<Car | null>(null);
    const [documentsCar, setDocumentsCar] = useState<Car | null>(null);
    const [deletingCar, setDeletingCar] = useState<Car | null>(null);
    const [restoringCar, setRestoringCar] = useState<Car | null>(null);
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
            createCarColumns({
                onStatusChange: setStatusCar,
                onManageDocuments: setDocumentsCar,
                onDelete: setDeletingCar,
                onRestore: setRestoringCar,
            }),
        [],
    );

    const table = useTable({
        features: carTableFeatures,
        data,
        columns,
        getRowId: (row) => String(row.id),
        getColumnCanGlobalFilter: (column) =>
            ['name', 'license_plate', 'color'].includes(column.id),
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
        CarStatus | undefined;
    const documentFilter = table.getColumn('documents')?.getFilterValue() as
        VehicleDocumentState | undefined;
    const archiveFilter = table.getColumn('is_archived')?.getFilterValue() as
        boolean | undefined;
    const filteredCount = table.getFilteredRowModel().rows.length;
    const { pageIndex, pageSize } = pagination;
    const pageCount = Math.max(table.getPageCount(), 1);
    const hasFilters =
        search.length > 0 ||
        statusFilter !== undefined ||
        documentFilter !== undefined ||
        archiveFilter !== false;

    function resetFilters() {
        setGlobalFilter('');
        setColumnFilters(initialColumnFilters);
        setPagination((current) => ({ ...current, pageIndex: 0 }));
    }

    return (
        <>
            <DataTableShell
                title="Data Mobil Showroom"
                description={`${filteredCount} dari ${data.length} unit mobil ditampilkan`}
                actions={
                    <Button asChild>
                        <Link href={CarController.create()}>
                            <PlusIcon className="size-4" />
                            Tambah Mobil
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
                                placeholder="Cari nama, plat nomor, warna..."
                                ariaLabel="Cari data mobil"
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
                            <SelectTrigger className="w-38">
                                <SelectValue placeholder="Status data" />
                            </SelectTrigger>
                            <SelectContent align="end">
                                <SelectItem value="active">
                                    Unit aktif
                                </SelectItem>
                                <SelectItem value="archived">
                                    Diarsipkan
                                </SelectItem>
                                <SelectItem value="all">Semua data</SelectItem>
                            </SelectContent>
                        </Select>

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
                            <SelectTrigger className="w-40">
                                <SelectValue placeholder="Semua status" />
                            </SelectTrigger>
                            <SelectContent align="end">
                                <SelectItem value="all">
                                    Semua status
                                </SelectItem>
                                <SelectItem value="available">
                                    Tersedia
                                </SelectItem>
                                <SelectItem value="booked">
                                    Dibooking
                                </SelectItem>
                                <SelectItem value="sold">Terjual</SelectItem>
                                <SelectItem value="maintenance">
                                    Perbaikan
                                </SelectItem>
                            </SelectContent>
                        </Select>

                        <Select
                            value={documentFilter ?? 'all'}
                            onValueChange={(value) => {
                                table
                                    .getColumn('documents')
                                    ?.setFilterValue(
                                        value === 'all' ? undefined : value,
                                    );
                                table.setPageIndex(0);
                            }}
                        >
                            <SelectTrigger className="w-40">
                                <SelectValue placeholder="Semua dokumen" />
                            </SelectTrigger>
                            <SelectContent align="end">
                                <SelectItem value="all">
                                    Semua dokumen
                                </SelectItem>
                                <SelectItem value="complete">
                                    Lengkap
                                </SelectItem>
                                <SelectItem value="incomplete">
                                    Belum lengkap
                                </SelectItem>
                                <SelectItem value="expired">
                                    Kedaluwarsa
                                </SelectItem>
                            </SelectContent>
                        </Select>

                        <DataTableColumnVisibility
                            columns={table.getAllLeafColumns()}
                            labels={carColumnLabels}
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
                                    title="Data mobil tidak ditemukan"
                                    description="Ubah kata pencarian atau filter yang digunakan."
                                />
                            )}
                        </TableBody>
                    </Table>
                </div>
            </DataTableShell>

            <VehicleDocumentsDialog
                car={documentsCar}
                onOpenChange={(open) => {
                    if (!open) {
                        setDocumentsCar(null);
                    }
                }}
            />
            <CarStatusDialog
                car={statusCar}
                onOpenChange={(open) => {
                    if (!open) {
                        setStatusCar(null);
                    }
                }}
            />
            <CarDeleteDialog
                car={deletingCar}
                onOpenChange={(open) => {
                    if (!open) {
                        setDeletingCar(null);
                    }
                }}
            />
            <CarRestoreDialog
                car={restoringCar}
                onOpenChange={(open) => {
                    if (!open) {
                        setRestoringCar(null);
                    }
                }}
            />
        </>
    );
}

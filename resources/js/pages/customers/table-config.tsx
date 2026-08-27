import {
    ArchiveBoxIcon,
    ArrowCounterClockwiseIcon,
    CaretDownIcon,
    CaretUpIcon,
    CaretUpDownIcon,
    CopyIcon,
    DotsThreeVerticalIcon,
    EyeIcon,
    PencilSimpleIcon,
} from '@phosphor-icons/react';
import {
    columnFilteringFeature,
    columnVisibilityFeature,
    createColumnHelper,
    createFilteredRowModel,
    createPaginatedRowModel,
    createSortedRowModel,
    filterFn_equals,
    filterFn_includesString,
    globalFilteringFeature,
    rowPaginationFeature,
    rowSelectionFeature,
    rowSortingFeature,
    sortFn_text,
    tableFeatures,
} from '@tanstack/react-table';
import { toast } from 'sonner';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Customer } from '@/pages/customers/types';

export const customerTableFeatures = tableFeatures({
    columnFilteringFeature,
    globalFilteringFeature,
    filteredRowModel: createFilteredRowModel(),
    filterFns: {
        equals: filterFn_equals,
        includesString: filterFn_includesString,
    },
    rowSortingFeature,
    sortedRowModel: createSortedRowModel(),
    sortFns: {
        text: sortFn_text,
    },
    rowPaginationFeature,
    paginatedRowModel: createPaginatedRowModel(),
    rowSelectionFeature,
    columnVisibilityFeature,
});

const columnHelper = createColumnHelper<
    typeof customerTableFeatures,
    Customer
>();

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
});

function SortableHeader({
    label,
    isSorted,
    onToggle,
}: {
    label: string;
    isSorted: false | 'asc' | 'desc';
    onToggle: ((event: unknown) => void) | undefined;
}) {
    return (
        <Button
            variant="ghost"
            size="sm"
            className="-ml-2 h-8 px-2"
            onClick={onToggle}
            aria-label={`Urutkan berdasarkan ${label}`}
            aria-sort={
                isSorted === 'asc'
                    ? 'ascending'
                    : isSorted === 'desc'
                      ? 'descending'
                      : 'none'
            }
        >
            {label}
            {isSorted === 'asc' ? (
                <CaretUpIcon className="size-4" />
            ) : isSorted === 'desc' ? (
                <CaretDownIcon className="size-4" />
            ) : (
                <CaretUpDownIcon className="size-4 opacity-60" />
            )}
        </Button>
    );
}

async function copyText(value: string, label: string) {
    try {
        await navigator.clipboard.writeText(value);
        toast.success(`${label} berhasil disalin.`);
    } catch {
        toast.error(`${label} gagal disalin.`);
    }
}

function maskNik(value: string): string {
    return `${value.slice(0, 6)}••••••${value.slice(-4)}`;
}

type CustomerColumnActions = {
    onDetail: (customer: Customer) => void;
    onEdit: (customer: Customer) => void;
    onChangeStatus: (customer: Customer) => void;
};

export function createCustomerColumns({
    onDetail,
    onEdit,
    onChangeStatus,
}: CustomerColumnActions) {
    return columnHelper.columns([
        columnHelper.display({
            id: 'select',
            enableHiding: false,
            enableSorting: false,
            header: ({ table }) => (
                <Checkbox
                    checked={
                        table.getIsAllPageRowsSelected() ||
                        (table.getIsSomePageRowsSelected() && 'indeterminate')
                    }
                    onCheckedChange={(value) =>
                        table.toggleAllPageRowsSelected(value === true)
                    }
                    aria-label="Pilih semua customer pada halaman ini"
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) =>
                        row.toggleSelected(value === true)
                    }
                    aria-label={`Pilih customer ${row.original.name}`}
                />
            ),
        }),
        columnHelper.accessor('created_at', {
            id: 'number',
            header: ({ column }) => (
                <SortableHeader
                    label="No."
                    isSorted={column.getIsSorted()}
                    onToggle={column.getToggleSortingHandler()}
                />
            ),
            enableHiding: false,
            enableSorting: true,
            sortDescFirst: true,
            cell: ({ row }) => {
                const index = row.getDisplayIndex();

                return index === -1 ? '—' : index + 1;
            },
            sortFn: (rowA, rowB) => {
                const timeA = new Date(rowA.original.created_at).getTime();
                const timeB = new Date(rowB.original.created_at).getTime();

                if (timeA === timeB) {
                    return rowA.original.id - rowB.original.id;
                }

                return timeA - timeB;
            },
        }),
        columnHelper.accessor('name', {
            header: ({ column }) => (
                <SortableHeader
                    label="Nama Customer"
                    isSorted={column.getIsSorted()}
                    onToggle={column.getToggleSortingHandler()}
                />
            ),
            cell: ({ row }) => (
                <div className="min-w-40">
                    <div className="font-medium">{row.original.name}</div>
                </div>
            ),
            filterFn: 'includesString',
            sortFn: 'text',
        }),
        columnHelper.accessor((row) => row.deleted_at !== null, {
            id: 'is_archived',
            header: ({ column }) => (
                <SortableHeader
                    label="Status"
                    isSorted={column.getIsSorted()}
                    onToggle={column.getToggleSortingHandler()}
                />
            ),
            cell: ({ getValue }) => (
                <StatusBadge status={getValue() ? 'archived' : 'active'} />
            ),
            filterFn: 'equals',
        }),
        columnHelper.accessor('phone', {
            header: ({ column }) => (
                <SortableHeader
                    label="Telepon / WhatsApp"
                    isSorted={column.getIsSorted()}
                    onToggle={column.getToggleSortingHandler()}
                />
            ),
            cell: ({ getValue }) => {
                const phone = getValue();

                if (!phone) {
                    return <span className="text-muted-foreground">—</span>;
                }

                return <span className="font-mono text-sm">{phone}</span>;
            },
            filterFn: 'includesString',
            sortFn: 'text',
        }),
        columnHelper.accessor('ktp_number', {
            header: ({ column }) => (
                <SortableHeader
                    label="No. KTP / NIK"
                    isSorted={column.getIsSorted()}
                    onToggle={column.getToggleSortingHandler()}
                />
            ),
            cell: ({ getValue }) => {
                const ktp = getValue();

                if (!ktp) {
                    return <span className="text-muted-foreground">—</span>;
                }

                return (
                    <code
                        className="rounded bg-muted px-1.5 py-0.5 text-xs"
                        title="NIK disamarkan untuk melindungi data pribadi"
                    >
                        {maskNik(ktp)}
                    </code>
                );
            },
            filterFn: 'includesString',
            sortFn: 'text',
        }),
        columnHelper.accessor('address', {
            header: ({ column }) => (
                <SortableHeader
                    label="Alamat"
                    isSorted={column.getIsSorted()}
                    onToggle={column.getToggleSortingHandler()}
                />
            ),
            cell: ({ getValue }) => {
                const address = getValue();

                if (!address) {
                    return <span className="text-muted-foreground">—</span>;
                }

                return (
                    <div className="max-w-xs truncate text-sm" title={address}>
                        {address}
                    </div>
                );
            },
            filterFn: 'includesString',
            sortFn: 'text',
        }),
        columnHelper.accessor('created_at', {
            header: ({ column }) => (
                <SortableHeader
                    label="Dibuat"
                    isSorted={column.getIsSorted()}
                    onToggle={column.getToggleSortingHandler()}
                />
            ),
            cell: ({ getValue }) => dateFormatter.format(new Date(getValue())),
            sortFn: 'text',
        }),
        columnHelper.display({
            id: 'actions',
            header: () => <span className="sr-only">Aksi</span>,
            enableHiding: false,
            enableSorting: false,
            cell: ({ row }) => (
                <div className="flex justify-end">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="size-8"
                                aria-label={`Buka aksi untuk ${row.original.name}`}
                            >
                                <DotsThreeVerticalIcon className="size-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onSelect={() => onDetail(row.original)}
                            >
                                <EyeIcon />
                                Detail customer
                            </DropdownMenuItem>
                            {row.original.phone && (
                                <DropdownMenuItem
                                    onSelect={() =>
                                        void copyText(
                                            row.original.phone ?? '',
                                            'Nomor telepon',
                                        )
                                    }
                                >
                                    <CopyIcon />
                                    Salin no. HP
                                </DropdownMenuItem>
                            )}
                            {row.original.phone && <DropdownMenuSeparator />}
                            {row.original.deleted_at === null && (
                                <DropdownMenuItem
                                    onSelect={() => onEdit(row.original)}
                                >
                                    <PencilSimpleIcon />
                                    Edit customer
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                                className={
                                    row.original.deleted_at === null
                                        ? 'text-red-500 focus:text-red-500'
                                        : 'text-emerald-600 focus:text-emerald-600 dark:text-emerald-500 dark:focus:text-emerald-500'
                                }
                                onSelect={() => onChangeStatus(row.original)}
                            >
                                {row.original.deleted_at === null ? (
                                    <ArchiveBoxIcon className="text-red-500" />
                                ) : (
                                    <ArrowCounterClockwiseIcon className="text-emerald-600 dark:text-emerald-500" />
                                )}
                                {row.original.deleted_at === null
                                    ? 'Arsipkan customer'
                                    : 'Pulihkan customer'}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            ),
        }),
    ]);
}

export const customerColumnLabels: Record<string, string> = {
    name: 'Nama Customer',
    is_archived: 'Status',
    phone: 'Telepon / WhatsApp',
    ktp_number: 'No. KTP / NIK',
    address: 'Alamat',
    created_at: 'Tanggal Dibuat',
};

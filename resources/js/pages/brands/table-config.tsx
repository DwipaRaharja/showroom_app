import {
    CaretDownIcon,
    CaretUpIcon,
    CaretUpDownIcon,
    CheckCircleIcon,
    CopyIcon,
    DotsThreeVerticalIcon,
    PencilSimpleIcon,
    PowerIcon,
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
import { Badge } from '@/components/ui/badge';
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
import type { Brand } from '@/pages/brands/types';

export const brandTableFeatures = tableFeatures({
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

const columnHelper = createColumnHelper<typeof brandTableFeatures, Brand>();

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
            className="-ml-3 h-8"
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

type BrandColumnActions = {
    onEdit: (brand: Brand) => void;
    onToggleStatus: (brand: Brand) => void;
};

export function createBrandColumns({
    onEdit,
    onToggleStatus,
}: BrandColumnActions) {
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
                    aria-label="Pilih semua merek pada halaman ini"
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) =>
                        row.toggleSelected(value === true)
                    }
                    aria-label={`Pilih merek ${row.original.name}`}
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
                    label="Nama Merek"
                    isSorted={column.getIsSorted()}
                    onToggle={column.getToggleSortingHandler()}
                />
            ),
            cell: ({ row }) => (
                <div className="min-w-40">
                    <div className="font-medium">{row.original.name}</div>
                    <div className="text-xs text-muted-foreground">
                        {row.original.slug}
                    </div>
                </div>
            ),
            filterFn: 'includesString',
            sortFn: 'text',
        }),
        columnHelper.accessor('slug', {
            header: ({ column }) => (
                <SortableHeader
                    label="Slug"
                    isSorted={column.getIsSorted()}
                    onToggle={column.getToggleSortingHandler()}
                />
            ),
            cell: ({ getValue }) => (
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                    {getValue()}
                </code>
            ),
            filterFn: 'includesString',
            sortFn: 'text',
        }),
        columnHelper.accessor('is_active', {
            header: ({ column }) => (
                <SortableHeader
                    label="Status"
                    isSorted={column.getIsSorted()}
                    onToggle={column.getToggleSortingHandler()}
                />
            ),
            cell: ({ getValue }) =>
                getValue() ? (
                    <Badge className="bg-emerald-600 hover:bg-emerald-600">
                        Aktif
                    </Badge>
                ) : (
                    <Badge variant="secondary">Tidak aktif</Badge>
                ),
            filterFn: 'equals',
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
                                onSelect={() =>
                                    void copyText(
                                        String(row.original.id),
                                        'ID merek',
                                    )
                                }
                            >
                                <CopyIcon />
                                Salin ID
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onSelect={() =>
                                    void copyText(row.original.slug, 'Slug')
                                }
                            >
                                <CopyIcon />
                                Salin slug
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onSelect={() => onEdit(row.original)}
                            >
                                <PencilSimpleIcon />
                                Edit merek
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className={
                                    row.original.is_active
                                        ? 'text-red-500 focus:text-red-500'
                                        : 'text-emerald-600 focus:text-emerald-600 dark:text-emerald-500 dark:focus:text-emerald-500'
                                }
                                onSelect={() => onToggleStatus(row.original)}
                            >
                                {row.original.is_active ? (
                                    <PowerIcon className="text-red-500" />
                                ) : (
                                    <CheckCircleIcon className="text-emerald-600 dark:text-emerald-500" />
                                )}
                                {row.original.is_active
                                    ? 'Nonaktifkan'
                                    : 'Aktifkan'}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            ),
        }),
    ]);
}

export const brandColumnLabels: Record<string, string> = {
    name: 'Nama Merek',
    slug: 'Slug',
    is_active: 'Status',
    created_at: 'Tanggal Dibuat',
};

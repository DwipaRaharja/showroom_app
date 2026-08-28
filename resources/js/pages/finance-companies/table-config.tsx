import {
    BankIcon,
    CheckCircleIcon,
    CopyIcon,
    DotsThreeVerticalIcon,
    PencilSimpleIcon,
    PowerIcon,
    TrashIcon,
    WhatsappLogoIcon,
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
    rowSortingFeature,
    sortFn_text,
    tableFeatures,
} from '@tanstack/react-table';
import { SortableTableHeader } from '@/components/data-table/sortable-table-header';
import { StatusBadge } from '@/components/status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { copyToClipboard } from '@/lib/clipboard';
import { formatDate } from '@/lib/formatters';
import type { FinanceCompany } from '@/pages/finance-companies/types';

export const financeCompanyTableFeatures = tableFeatures({
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
    columnVisibilityFeature,
});

const columnHelper = createColumnHelper<
    typeof financeCompanyTableFeatures,
    FinanceCompany
>();

function whatsappUrl(phone: string | null): string | null {
    const normalized = phone?.replace(/\D/g, '') ?? '';

    if (!normalized) {
        return null;
    }

    const internationalNumber = normalized.startsWith('0')
        ? `62${normalized.slice(1)}`
        : normalized.startsWith('8')
          ? `62${normalized}`
          : normalized;

    return `https://wa.me/${internationalNumber}`;
}

type FinanceCompanyColumnActions = {
    onEdit: (company: FinanceCompany) => void;
    onToggleStatus: (company: FinanceCompany) => void;
    onDelete: (company: FinanceCompany) => void;
};

export function createFinanceCompanyColumns({
    onEdit,
    onToggleStatus,
    onDelete,
}: FinanceCompanyColumnActions) {
    return columnHelper.columns([
        columnHelper.accessor('created_at', {
            id: 'number',
            header: ({ column }) => (
                <SortableTableHeader
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
                const timeA = rowA.original.created_at
                    ? new Date(rowA.original.created_at).getTime()
                    : 0;
                const timeB = rowB.original.created_at
                    ? new Date(rowB.original.created_at).getTime()
                    : 0;

                if (timeA === timeB) {
                    return rowA.original.id - rowB.original.id;
                }

                return timeA - timeB;
            },
        }),
        columnHelper.accessor(
            (company) => `${company.name} ${company.code ?? ''}`.trim(),
            {
                id: 'company',
                header: ({ column }) => (
                    <SortableTableHeader
                        label="Perusahaan leasing"
                        isSorted={column.getIsSorted()}
                        onToggle={column.getToggleSortingHandler()}
                    />
                ),
                cell: ({ row }) => (
                    <div className="flex min-w-52 items-center gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <BankIcon className="size-5" weight="fill" />
                        </div>
                        <div className="min-w-0 space-y-1">
                            <div className="truncate text-sm font-semibold text-foreground">
                                {row.original.name}
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5">
                                {row.original.code ? (
                                    <Badge
                                        variant="outline"
                                        className="font-mono text-[10px] tracking-wider uppercase"
                                    >
                                        {row.original.code}
                                    </Badge>
                                ) : (
                                    <span className="text-xs text-muted-foreground">
                                        Tanpa kode
                                    </span>
                                )}
                                <span className="text-[11px] text-muted-foreground">
                                    ID #{row.original.id}
                                </span>
                            </div>
                        </div>
                    </div>
                ),
                filterFn: 'includesString',
                sortFn: 'text',
            },
        ),
        columnHelper.accessor(
            (company) =>
                `${company.pic_name ?? ''} ${company.pic_phone ?? ''}`.trim(),
            {
                id: 'contact',
                header: ({ column }) => (
                    <SortableTableHeader
                        label="PIC / Marketing"
                        isSorted={column.getIsSorted()}
                        onToggle={column.getToggleSortingHandler()}
                    />
                ),
                cell: ({ row }) => {
                    const company = row.original;
                    const waUrl = whatsappUrl(company.pic_phone);

                    if (!company.pic_name && !company.pic_phone) {
                        return (
                            <span className="text-xs text-muted-foreground">
                                Belum ada kontak
                            </span>
                        );
                    }

                    return (
                        <div className="min-w-40 space-y-0.5">
                            <div className="text-sm font-medium text-foreground">
                                {company.pic_name ?? 'PIC belum dicatat'}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <span className="font-mono">
                                    {company.pic_phone ?? 'Nomor belum dicatat'}
                                </span>
                                {waUrl && (
                                    <a
                                        href={waUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="rounded p-0.5 text-emerald-600 transition-colors hover:bg-emerald-500/10 hover:text-emerald-700 dark:text-emerald-500"
                                        aria-label={`Hubungi ${company.pic_name ?? company.name} melalui WhatsApp`}
                                    >
                                        <WhatsappLogoIcon
                                            className="size-4"
                                            weight="fill"
                                        />
                                    </a>
                                )}
                            </div>
                        </div>
                    );
                },
                filterFn: 'includesString',
                sortFn: 'text',
            },
        ),
        columnHelper.accessor('notes', {
            header: 'Catatan kerja sama',
            cell: ({ getValue }) => {
                const notes = getValue();

                return notes ? (
                    <p
                        className="line-clamp-2 max-w-64 text-xs leading-relaxed text-muted-foreground"
                        title={notes}
                    >
                        {notes}
                    </p>
                ) : (
                    <span className="text-xs text-muted-foreground">
                        Belum ada catatan
                    </span>
                );
            },
            filterFn: 'includesString',
            enableSorting: false,
        }),
        columnHelper.accessor('sales_count', {
            header: ({ column }) => (
                <SortableTableHeader
                    label="Transaksi"
                    isSorted={column.getIsSorted()}
                    onToggle={column.getToggleSortingHandler()}
                />
            ),
            cell: ({ getValue }) => {
                const count = getValue() ?? 0;

                return (
                    <div className="min-w-24">
                        <div className="text-sm font-semibold tabular-nums">
                            {count}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            penjualan kredit
                        </div>
                    </div>
                );
            },
            sortFn: (rowA, rowB) =>
                (rowA.original.sales_count ?? 0) -
                (rowB.original.sales_count ?? 0),
        }),
        columnHelper.accessor('is_active', {
            header: ({ column }) => (
                <SortableTableHeader
                    label="Status"
                    isSorted={column.getIsSorted()}
                    onToggle={column.getToggleSortingHandler()}
                />
            ),
            cell: ({ getValue }) => <StatusBadge status={getValue()} />,
            filterFn: 'equals',
        }),
        columnHelper.accessor('created_at', {
            header: ({ column }) => (
                <SortableTableHeader
                    label="Ditambahkan"
                    isSorted={column.getIsSorted()}
                    onToggle={column.getToggleSortingHandler()}
                />
            ),
            cell: ({ getValue }) => {
                const value = getValue();

                return value ? (
                    <span className="text-xs whitespace-nowrap text-muted-foreground">
                        {formatDate(value)}
                    </span>
                ) : (
                    '—'
                );
            },
            sortFn: 'text',
        }),
        columnHelper.display({
            id: 'actions',
            header: () => <span className="sr-only">Aksi</span>,
            enableHiding: false,
            enableSorting: false,
            cell: ({ row }) => {
                const company = row.original;

                return (
                    <div className="flex justify-end">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-8"
                                    aria-label={`Buka aksi untuk ${company.name}`}
                                >
                                    <DotsThreeVerticalIcon className="size-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onSelect={() =>
                                        void copyToClipboard(
                                            company.name,
                                            'Nama perusahaan',
                                        )
                                    }
                                >
                                    <CopyIcon />
                                    Salin nama perusahaan
                                </DropdownMenuItem>
                                {company.pic_phone && (
                                    <DropdownMenuItem
                                        onSelect={() =>
                                            void copyToClipboard(
                                                company.pic_phone ?? '',
                                                'Nomor PIC',
                                            )
                                        }
                                    >
                                        <CopyIcon />
                                        Salin nomor PIC
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onSelect={() => onEdit(company)}
                                >
                                    <PencilSimpleIcon />
                                    Edit informasi
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    className={
                                        company.is_active
                                            ? 'text-red-500 focus:text-red-500'
                                            : 'text-emerald-600 focus:text-emerald-600 dark:text-emerald-500 dark:focus:text-emerald-500'
                                    }
                                    onSelect={() => onToggleStatus(company)}
                                >
                                    {company.is_active ? (
                                        <PowerIcon className="text-red-500" />
                                    ) : (
                                        <CheckCircleIcon />
                                    )}
                                    {company.is_active
                                        ? 'Nonaktifkan rekanan'
                                        : 'Aktifkan rekanan'}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onSelect={() => onDelete(company)}
                                    className="text-red-500 focus:text-red-500"
                                >
                                    <TrashIcon className="text-red-500" />
                                    Hapus leasing
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                );
            },
        }),
    ]);
}

export const financeCompanyColumnLabels: Record<string, string> = {
    company: 'Perusahaan leasing',
    contact: 'PIC / Marketing',
    notes: 'Catatan kerja sama',
    sales_count: 'Transaksi',
    is_active: 'Status',
    created_at: 'Tanggal ditambahkan',
};

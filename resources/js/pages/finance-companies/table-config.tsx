import {
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
    rowSelectionFeature,
    rowSortingFeature,
    sortFn_text,
    tableFeatures,
} from '@tanstack/react-table';
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
    rowSelectionFeature,
    columnVisibilityFeature,
});

const columnHelper = createColumnHelper<
    typeof financeCompanyTableFeatures,
    FinanceCompany
>();

export const financeCompanyColumnLabels: Record<string, string> = {
    name: 'Nama Perusahaan',
    contact: 'Kontak PIC / Marketing',
    notes: 'Catatan Kerjasama',
    sales_count: 'Penjualan Didanai',
    is_active: 'Status Rekanan',
    actions: 'Aksi',
};

export function createFinanceCompanyColumns({
    onEdit,
    onToggleStatus,
    onDelete,
}: {
    onEdit: (company: FinanceCompany) => void;
    onToggleStatus: (company: FinanceCompany) => void;
    onDelete: (company: FinanceCompany) => void;
}) {
    return columnHelper.columns([
        columnHelper.accessor('name', {
            id: 'name',
            header: 'Nama Perusahaan & Kode',
            cell: ({ row }) => {
                const company = row.original;

                return (
                    <div className="flex items-center gap-2">
                        <div className="space-y-0.5">
                            <div className="font-semibold text-foreground text-sm">
                                {company.name}
                            </div>
                            {company.code && (
                                <Badge variant="outline" className="font-mono text-[10px] tracking-wider uppercase">
                                    {company.code}
                                </Badge>
                            )}
                        </div>
                    </div>
                );
            },
        }),

        columnHelper.display({
            id: 'contact',
            header: 'Kontak PIC / Marketing',
            cell: ({ row }) => {
                const company = row.original;
                const phoneClean = company.pic_phone?.replace(/\D/g, '') ?? '';
                const waUrl = phoneClean
                    ? `https://wa.me/${phoneClean.startsWith('0') ? '62' + phoneClean.slice(1) : phoneClean}`
                    : null;

                if (!company.pic_name && !company.pic_phone) {
                    return <span className="text-muted-foreground text-xs">—</span>;
                }

                return (
                    <div className="space-y-0.5 text-xs">
                        {company.pic_name && (
                            <div className="font-medium text-foreground">
                                {company.pic_name}
                            </div>
                        )}
                        {company.pic_phone && (
                            <div className="flex items-center gap-1.5 font-mono text-muted-foreground">
                                <span>{company.pic_phone}</span>
                                {waUrl && (
                                    <a
                                        href={waUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                                        title="Hubungi via WhatsApp"
                                    >
                                        <WhatsappLogoIcon className="size-3.5" weight="fill" />
                                    </a>
                                )}
                            </div>
                        )}
                    </div>
                );
            },
        }),

        columnHelper.accessor('notes', {
            id: 'notes',
            header: 'Catatan Kerjasama',
            cell: ({ row }) => {
                const notes = row.original.notes;

                if (!notes) {
                    return <span className="text-muted-foreground text-xs italic">Tidak ada catatan</span>;
                }

                return (
                    <p className="max-w-xs truncate text-xs text-muted-foreground" title={notes}>
                        {notes}
                    </p>
                );
            },
        }),

        columnHelper.accessor('sales_count', {
            id: 'sales_count',
            header: 'Penjualan Didanai',
            cell: ({ row }) => {
                const count = row.original.sales_count ?? 0;

                return (
                    <span className="font-semibold text-xs text-foreground">
                        {count} Transaksi
                    </span>
                );
            },
        }),

        columnHelper.accessor('is_active', {
            id: 'is_active',
            header: 'Status Rekanan',
            cell: ({ row }) => {
                const isActive = row.original.is_active;

                return <StatusBadge status={isActive} />;
            },
        }),

        columnHelper.display({
            id: 'actions',
            header: () => <span className="sr-only">Aksi</span>,
            cell: ({ row }) => {
                const company = row.original;

                return (
                    <div className="text-right">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-8"
                                    aria-label="Aksi perusahaan leasing"
                                >
                                    <DotsThreeVerticalIcon className="size-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => onEdit(company)}>
                                    <PencilSimpleIcon className="mr-2 size-4" />
                                    Edit Informasi
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onToggleStatus(company)}>
                                    <PowerIcon className="mr-2 size-4" />
                                    {company.is_active ? 'Nonaktifkan' : 'Aktifkan Kembali'}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={() => onDelete(company)}
                                    className="text-red-600 focus:text-red-600 dark:text-red-400"
                                >
                                    <TrashIcon className="mr-2 size-4" />
                                    Hapus
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                );
            },
        }),
    ]);
}

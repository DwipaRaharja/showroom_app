import {
    CalendarBlankIcon,
    CopyIcon,
    DotsThreeVerticalIcon,
    EyeIcon,
    MoneyIcon,
    TrashIcon,
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
import { formatCurrency, formatDate } from '@/lib/formatters';
import type { PaymentType, Sale } from '@/pages/sales/types';

export const saleTableFeatures = tableFeatures({
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

const columnHelper = createColumnHelper<typeof saleTableFeatures, Sale>();

export function getPaymentTypeBadge(
    type: PaymentType,
    financeName?: string | null,
) {
    switch (type) {
        case 'cash_full':
            return (
                <Badge className="bg-emerald-600 text-white hover:bg-emerald-600 dark:bg-emerald-700">
                    Tunai Lunas
                </Badge>
            );
        case 'cash_tempo':
            return (
                <Badge className="bg-amber-500 text-white hover:bg-amber-500 dark:bg-amber-600">
                    Tunai Tempo
                </Badge>
            );
        case 'credit':
            return (
                <Badge className="bg-blue-600 text-white hover:bg-blue-600 dark:bg-blue-700">
                    Kredit {financeName ? `• ${financeName}` : ''}
                </Badge>
            );
        case 'trade_in':
            return (
                <Badge className="bg-purple-600 text-white hover:bg-purple-600 dark:bg-purple-700">
                    Tukar Tambah
                </Badge>
            );
        default:
            return <Badge variant="secondary">{type}</Badge>;
    }
}

type SaleColumnActions = {
    onShow: (sale: Sale) => void;
    onRecordPayment: (sale: Sale) => void;
    onDelete: (sale: Sale) => void;
};

export function createSaleColumns({
    onShow,
    onRecordPayment,
    onDelete,
}: SaleColumnActions) {
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

                return (
                    <span className="font-mono text-xs text-muted-foreground">
                        {index === -1 ? '—' : index + 1}
                    </span>
                );
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
        columnHelper.accessor('invoice_number', {
            header: ({ column }) => (
                <SortableTableHeader
                    label="No. Invoice"
                    isSorted={column.getIsSorted()}
                    onToggle={column.getToggleSortingHandler()}
                />
            ),
            cell: ({ row }) => (
                <div className="min-w-32">
                    <button
                        type="button"
                        onClick={() => onShow(row.original)}
                        className="font-mono text-xs font-semibold text-primary hover:underline"
                    >
                        {row.original.invoice_number}
                    </button>
                </div>
            ),
            filterFn: 'includesString',
            sortFn: 'text',
        }),
        columnHelper.accessor((row) => row.car?.name ?? '', {
            id: 'car',
            header: 'Unit Mobil',
            cell: ({ row }) => {
                const car = row.original.car;

                if (!car) {
                    return <span className="text-muted-foreground">—</span>;
                }

                return (
                    <div className="min-w-56 space-y-1">
                        <div className="font-semibold text-foreground">
                            {car.name}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                            {car.brand && (
                                <span className="font-medium text-primary">
                                    {car.brand.name}
                                </span>
                            )}
                            {car.license_plate && (
                                <>
                                    <span>•</span>
                                    <span className="font-mono font-medium">
                                        {car.license_plate}
                                    </span>
                                </>
                            )}
                            <span>•</span>
                            <span>{car.year}</span>
                        </div>
                    </div>
                );
            },
        }),
        columnHelper.accessor((row) => row.customer?.name ?? '', {
            id: 'customer',
            header: 'Pembeli (Customer)',
            cell: ({ row }) => {
                const customer = row.original.customer;

                if (!customer) {
                    return <span className="text-muted-foreground">—</span>;
                }

                return (
                    <div className="min-w-44 space-y-0.5">
                        <div className="font-medium text-foreground">
                            {customer.name}
                        </div>
                        {customer.phone && (
                            <div className="font-mono text-xs text-muted-foreground">
                                {customer.phone}
                            </div>
                        )}
                    </div>
                );
            },
        }),
        columnHelper.accessor('payment_type', {
            header: 'Skema Bayar',
            cell: ({ row }) => (
                <div className="min-w-36">
                    {getPaymentTypeBadge(
                        row.original.payment_type,
                        row.original.finance_company?.name,
                    )}
                </div>
            ),
        }),
        columnHelper.accessor('deal_price', {
            header: ({ column }) => (
                <SortableTableHeader
                    label="Harga Kesepakatan"
                    isSorted={column.getIsSorted()}
                    onToggle={column.getToggleSortingHandler()}
                />
            ),
            cell: ({ getValue }) => (
                <div className="min-w-40 font-semibold text-foreground">
                    {formatCurrency(getValue())}
                </div>
            ),
            sortFn: (rowA, rowB) =>
                rowA.original.deal_price - rowB.original.deal_price,
        }),
        columnHelper.accessor(
            (row) => {
                const paid = row.total_paid ?? 0;

                return Math.max(0, row.deal_price - paid);
            },
            {
                id: 'remaining_bill',
                header: 'Sisa Piutang',
                cell: ({ getValue, row }) => {
                    const remaining = getValue();
                    const isSettled = remaining <= 0;

                    return (
                        <div className="min-w-36 space-y-0.5">
                            <div
                                className={`text-sm font-semibold ${isSettled ? 'text-emerald-600 dark:text-emerald-500' : 'text-amber-600 dark:text-amber-500'}`}
                            >
                                {isSettled
                                    ? 'Lunas'
                                    : formatCurrency(remaining)}
                            </div>
                            {!isSettled && (
                                <div className="text-xs text-muted-foreground">
                                    Masuk:{' '}
                                    {formatCurrency(
                                        row.original.total_paid ?? 0,
                                    )}
                                </div>
                            )}
                        </div>
                    );
                },
            },
        ),
        columnHelper.display({
            id: 'due_or_disbursement',
            header: 'Jatuh Tempo / Cair',
            cell: ({ row }) => {
                const isCredit = row.original.payment_type === 'credit';
                const dateStr = isCredit
                    ? row.original.disbursement_estimated_date
                    : row.original.due_date;

                if (!dateStr) {
                    return <span className="text-muted-foreground">—</span>;
                }

                return (
                    <div className="min-w-36 space-y-1 text-xs">
                        <div className="flex items-center gap-1 font-medium">
                            <CalendarBlankIcon className="size-3.5 text-muted-foreground" />
                            {formatDate(dateStr.slice(0, 10))}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                            {isCredit ? 'Est. Cair Leasing' : 'Jatuh Tempo'}
                        </div>
                    </div>
                );
            },
        }),
        columnHelper.accessor('status', {
            header: ({ column }) => (
                <SortableTableHeader
                    label="Status"
                    isSorted={column.getIsSorted()}
                    onToggle={column.getToggleSortingHandler()}
                />
            ),
            cell: ({ getValue }) => (
                <div className="min-w-32">
                    <StatusBadge status={getValue()} />
                </div>
            ),
            filterFn: 'equals',
        }),
        columnHelper.display({
            id: 'actions',
            header: () => <span className="sr-only">Aksi</span>,
            enableHiding: false,
            enableSorting: false,
            cell: ({ row }) => {
                const remaining = Math.max(
                    0,
                    row.original.deal_price - (row.original.total_paid ?? 0),
                );
                const hasUnpaidBonus =
                    row.original.payment_type === 'credit' &&
                    row.original.leasing_bonus > 0 &&
                    (row.original.total_bonus_paid ?? 0) <
                        row.original.leasing_bonus;
                const canAcceptPayment =
                    row.original.can_accept_payment ??
                    (remaining > 0 || hasUnpaidBonus);

                return (
                    <div className="flex w-12 justify-end">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-8"
                                    aria-label={`Buka aksi untuk penjualan ${row.original.invoice_number}`}
                                >
                                    <DotsThreeVerticalIcon className="size-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52">
                                <DropdownMenuLabel>
                                    Aksi Penjualan
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onSelect={() => onShow(row.original)}
                                >
                                    <EyeIcon />
                                    Lihat detail & SPK
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onSelect={() =>
                                        void copyToClipboard(
                                            row.original.invoice_number,
                                            'Nomor invoice',
                                        )
                                    }
                                >
                                    <CopyIcon />
                                    Salin no. invoice
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {canAcceptPayment && (
                                    <DropdownMenuItem
                                        className="text-emerald-600 focus:text-emerald-600 dark:text-emerald-500 dark:focus:text-emerald-500 font-medium"
                                        onSelect={() =>
                                            onRecordPayment(row.original)
                                        }
                                    >
                                        <MoneyIcon className="text-emerald-600 dark:text-emerald-500" />
                                        Catat pembayaran
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                    className="text-red-500 focus:text-red-500"
                                    onSelect={() => onDelete(row.original)}
                                >
                                    <TrashIcon className="text-red-500" />
                                    Batalkan penjualan
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                );
            },
        }),
    ]);
}

export const saleColumnLabels: Record<string, string> = {
    invoice_number: 'No. Invoice',
    car: 'Unit Mobil',
    customer: 'Pembeli (Customer)',
    payment_type: 'Skema Bayar',
    deal_price: 'Harga Deal',
    remaining_bill: 'Sisa Piutang',
    due_or_disbursement: 'Jatuh Tempo / Cair',
    status: 'Status',
    created_at: 'Tanggal Transaksi',
};

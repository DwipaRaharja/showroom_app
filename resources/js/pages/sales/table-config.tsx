import {
    CalendarBlankIcon,
    CaretDownIcon,
    CaretUpIcon,
    CaretUpDownIcon,
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
    rowSelectionFeature,
    rowSortingFeature,
    sortFn_text,
    tableFeatures,
} from '@tanstack/react-table';
import { toast } from 'sonner';
import { StatusBadge } from '@/components/status-badge';
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
    rowSelectionFeature,
    columnVisibilityFeature,
});

const columnHelper = createColumnHelper<typeof saleTableFeatures, Sale>();

const currencyFormatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
});

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
                    aria-label="Pilih semua penjualan pada halaman ini"
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) =>
                        row.toggleSelected(value === true)
                    }
                    aria-label={`Pilih penjualan ${row.original.invoice_number}`}
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
        columnHelper.accessor('invoice_number', {
            header: ({ column }) => (
                <SortableHeader
                    label="No. Invoice"
                    isSorted={column.getIsSorted()}
                    onToggle={column.getToggleSortingHandler()}
                />
            ),
            cell: ({ row }) => (
                <button
                    type="button"
                    onClick={() => onShow(row.original)}
                    className="font-mono text-xs font-semibold text-primary hover:underline"
                >
                    {row.original.invoice_number}
                </button>
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
                    <div className="min-w-44">
                        <div className="font-semibold text-foreground">
                            {car.name}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-xs text-muted-foreground">
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
                    <div className="min-w-36">
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
            cell: ({ row }) =>
                getPaymentTypeBadge(
                    row.original.payment_type,
                    row.original.finance_company?.name,
                ),
        }),
        columnHelper.accessor('deal_price', {
            header: ({ column }) => (
                <SortableHeader
                    label="Harga Kesepakatan"
                    isSorted={column.getIsSorted()}
                    onToggle={column.getToggleSortingHandler()}
                />
            ),
            cell: ({ getValue }) => (
                <div className="font-semibold text-foreground">
                    {currencyFormatter.format(getValue())}
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
                        <div className="min-w-28">
                            <div
                                className={`text-sm font-semibold ${isSettled ? 'text-emerald-600 dark:text-emerald-500' : 'text-amber-600 dark:text-amber-500'}`}
                            >
                                {isSettled
                                    ? 'Lunas'
                                    : currencyFormatter.format(remaining)}
                            </div>
                            {!isSettled && (
                                <div className="text-xs text-muted-foreground">
                                    Masuk:{' '}
                                    {currencyFormatter.format(
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

                const targetDate = new Date(dateStr);

                return (
                    <div className="min-w-28 space-y-0.5 text-xs">
                        <div className="flex items-center gap-1 font-medium">
                            <CalendarBlankIcon className="size-3.5 text-muted-foreground" />
                            {dateFormatter.format(targetDate)}
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
                <SortableHeader
                    label="Status"
                    isSorted={column.getIsSorted()}
                    onToggle={column.getToggleSortingHandler()}
                />
            ),
            cell: ({ getValue }) => <StatusBadge status={getValue()} />,
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
                    <div className="flex justify-end">
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
                                {canAcceptPayment && (
                                    <DropdownMenuItem
                                        onSelect={() =>
                                            onRecordPayment(row.original)
                                        }
                                    >
                                        <MoneyIcon className="text-emerald-600" />
                                        Catat pembayaran
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                    onSelect={() =>
                                        void copyText(
                                            row.original.invoice_number,
                                            'Nomor invoice',
                                        )
                                    }
                                >
                                    <CopyIcon />
                                    Salin no. invoice
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
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

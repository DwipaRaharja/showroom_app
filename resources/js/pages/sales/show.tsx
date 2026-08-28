import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeftIcon,
    ArrowsLeftRightIcon,
    BankIcon,
    CarProfileIcon,
    CheckCircleIcon,
    CopyIcon,
    DotsThreeVerticalIcon,
    HandCoinsIcon,
    KeyIcon,
    PlusIcon,
    PrinterIcon,
    ShieldCheckIcon,
    TrashIcon,
    UserIcon,
    WhatsappLogoIcon,
} from '@phosphor-icons/react';
import { useState } from 'react';
import PaymentController from '@/actions/App/Http/Controllers/PaymentController';
import VehicleHandoverController from '@/actions/App/Http/Controllers/VehicleHandoverController';
import { CardSectionHeader } from '@/components/card-section-header';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { DataRow } from '@/components/detail-item';
import { PageContainer } from '@/components/page-container';
import { PageHeader } from '@/components/page-header';
import { StatCard } from '@/components/stat-card';
import { StatCardGrid } from '@/components/stat-card-grid';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { copyToClipboard } from '@/lib/clipboard';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Spinner } from '@/components/ui/spinner';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { PaymentDialog } from '@/pages/sales/payment-dialog';
import { getPaymentTypeBadge } from '@/pages/sales/table-config';
import type { Payment, Sale } from '@/pages/sales/types';
import { index as salesIndex } from '@/routes/sales';

type Props = {
    sale: Sale;
};

const longDateOptions: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
};

function getPaymentCategoryLabel(category: string) {
    switch (category) {
        case 'down_payment':
            return 'Uang Muka (DP)';
        case 'installment':
            return 'Cicilan / Angsuran';
        case 'settlement':
            return 'Pelunasan Customer';
        case 'finance_disbursement':
            return 'Pencairan Pokok Leasing';
        case 'leasing_bonus':
            return 'Pencairan Bonus Leasing';
        default:
            return category;
    }
}

export default function SalesShow({ sale }: Props) {
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [deletingPayment, setDeletingPayment] = useState<Payment | null>(
        null,
    );

    const car = sale.car;
    const customer = sale.customer;
    const finance = sale.finance_company;
    const payments = sale.payments ?? [];
    const handoverEvents = sale.handover?.events ?? [];
    const latestHandoverEvent = [...handoverEvents].sort(
        (left, right) =>
            new Date(right.occurred_at).getTime() -
            new Date(left.occurred_at).getTime(),
    )[0];

    const tradeInValue =
        sale.payment_type === 'trade_in' ? (sale.trade_in_price ?? 0) : 0;
    const totalPaid =
        sale.total_paid ??
        payments
            .filter(
                (p) =>
                    p.status === 'confirmed' &&
                    p.payment_category !== 'leasing_bonus',
            )
            .reduce((acc, p) => acc + p.amount, 0);
    const remainingBill =
        sale.remaining_bill ??
        Math.max(0, sale.deal_price - tradeInValue - totalPaid);
    const customerPaymentShortfall =
        sale.customer_payment_shortfall ?? remainingBill;
    const totalBonusPaid =
        sale.total_bonus_paid ??
        payments
            .filter(
                (p) =>
                    p.status === 'confirmed' &&
                    p.payment_category === 'leasing_bonus',
            )
            .reduce((acc, p) => acc + p.amount, 0);
    const bonusRemaining = Math.max(0, sale.leasing_bonus - totalBonusPaid);
    const isSettled = remainingBill <= 0;
    const canDeliverVehicle =
        sale.can_deliver_vehicle ?? sale.status !== 'cancelled';
    const canDeliverBpkb = sale.can_deliver_bpkb ?? remainingBill <= 0;
    const canAddTracking =
        sale.status !== 'cancelled' &&
        (canDeliverVehicle || sale.handover?.vehicle_delivered_at != null);
    const canAcceptPayment =
        sale.can_accept_payment ??
        ((sale.payment_type === 'credit'
            ? customerPaymentShortfall > 0
            : remainingBill > 0) ||
            (sale.payment_type === 'credit' && bonusRemaining > 0));

    const purchasePrice = car?.capital?.total_capital ?? 0;
    const estimatedProfit =
        sale.deal_price + sale.leasing_bonus - purchasePrice;

    const whatsappLink = customer?.phone
        ? `https://wa.me/${customer.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
              `Halo Bpk/Ibu ${customer.name}, perihal transaksi SPK ${sale.invoice_number} unit ${car?.name ?? 'mobil'}.`,
          )}`
        : null;

    return (
        <>
            <Head title={`Detail SPK Penjualan ${sale.invoice_number}`} />

            <PageContainer>
                <PageHeader
                    backHref={salesIndex.url()}
                    backLabel="Kembali ke daftar penjualan"
                    title={sale.invoice_number}
                    titleClassName="font-mono text-xl font-bold"
                    titleAddon={
                        <>
                            <StatusBadge status={sale.status} />
                            {getPaymentTypeBadge(
                                sale.payment_type,
                                finance?.name,
                            )}
                        </>
                    }
                    description={
                        <>
                            Dibuat pada{' '}
                            {formatDate(sale.created_at, longDateOptions)}
                        </>
                    }
                    actions={
                        <>
                            {canAcceptPayment && (
                                <Button
                                    onClick={() => setIsPaymentOpen(true)}
                                    className="bg-emerald-600 text-white shadow-xs hover:bg-emerald-700"
                                >
                                    <PlusIcon className="size-4" />
                                    Catat Pembayaran Masuk
                                </Button>
                            )}

                            <Button
                                variant="outline"
                                asChild
                                className="print:hidden"
                            >
                                <Link
                                    href={VehicleHandoverController.printBast.url(
                                        sale.id,
                                    )}
                                >
                                    <PrinterIcon className="size-4" />
                                    Cetak BAST
                                </Link>
                            </Button>

                            <Button
                                variant="outline"
                                onClick={() => window.print()}
                                className="print:hidden"
                            >
                                <PrinterIcon className="size-4" />
                                Cetak SPK / Invoice
                            </Button>
                        </>
                    }
                />

                <StatCardGrid>
                    <StatCard
                        title="Harga Kesepakatan (Deal)"
                        value={formatCurrency(sale.deal_price)}
                        description="Harga Jual Unit"
                        variant="default"
                    />

                    <StatCard
                        title={
                            sale.payment_type === 'trade_in'
                                ? 'Total Nilai Masuk & Mobil'
                                : 'Total Uang Masuk'
                        }
                        value={formatCurrency(
                            sale.payment_type === 'trade_in'
                                ? tradeInValue + totalPaid
                                : totalPaid,
                        )}
                        description={
                            isSettled
                                ? '✓ Lunas 100%'
                                : sale.payment_type === 'trade_in'
                                  ? `Unit: ${formatCurrency(tradeInValue)} + Kas: ${formatCurrency(totalPaid)}`
                                  : `${Math.round((totalPaid / sale.deal_price) * 100)}% dari total tagihan`
                        }
                        variant="success"
                    />

                    <StatCard
                        title="Sisa Piutang Showroom"
                        value={formatCurrency(remainingBill)}
                        description={
                            isSettled
                                ? 'Tidak ada tagihan tertunda'
                                : sale.payment_type === 'credit'
                                  ? customerPaymentShortfall > 0
                                      ? 'Menunggu pembayaran customer'
                                      : 'Menunggu penyerahan BPKB & pencairan leasing'
                                  : sale.payment_type === 'trade_in'
                                    ? 'Menunggu pelunasan sisa tukar tambah'
                                    : 'Menunggu pelunasan tempo'
                        }
                        variant={isSettled ? 'success' : 'warning'}
                    />

                    <StatCard
                        title={
                            sale.payment_type === 'credit'
                                ? 'Bonus Leasing & Estimasi Margin'
                                : 'Estimasi Margin Laba'
                        }
                        value={formatCurrency(estimatedProfit)}
                        description={
                            sale.leasing_bonus > 0
                                ? `Termasuk bonus Rp ${formatCurrency(sale.leasing_bonus)}`
                                : `Modal beli: ${formatCurrency(purchasePrice)}`
                        }
                        variant="info"
                    />
                </StatCardGrid>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Left 2 Columns: Payment History Ledger & Trade-in */}
                    <div className="space-y-6 lg:col-span-2">
                        {/* Trade-In Vehicle Card (Above Payment History) */}
                        {sale.payment_type === 'trade_in' && (
                            <Card className="border-purple-500/20 bg-purple-500/5 shadow-xs dark:bg-purple-500/10">
                                <CardSectionHeader
                                    className="pb-3"
                                    icon={
                                        <ArrowsLeftRightIcon
                                            className="size-5"
                                            weight="bold"
                                        />
                                    }
                                    iconClassName="bg-purple-500/20 text-purple-600 dark:text-purple-400"
                                    title="Unit Mobil Tukar Tambah"
                                    description="Unit kendaraan tukar tambah yang memotong nilai sisa piutang showroom."
                                    action={
                                        sale.trade_in_price ? (
                                            <div className="text-left sm:text-right">
                                                <div className="text-[11px] font-medium text-muted-foreground">
                                                    Nilai Tukar Tambah
                                                </div>
                                                <div className="font-mono text-base font-bold text-purple-600 dark:text-purple-400">
                                                    {formatCurrency(
                                                        sale.trade_in_price,
                                                    )}
                                                </div>
                                            </div>
                                        ) : null
                                    }
                                />
                                <CardContent className="space-y-4 text-xs">
                                    <div>
                                        <div className="text-base font-bold text-foreground">
                                            {[
                                                sale.trade_in_brand,
                                                sale.trade_in_car_name,
                                            ]
                                                .filter(Boolean)
                                                .join(' ') || 'Unit Tukar Tambah'}
                                        </div>
                                    </div>

                                    {sale.trade_in_license_plate && (
                                        <div className="flex items-center justify-between rounded-lg border bg-background/60 p-2.5 font-mono">
                                            <span className="text-muted-foreground">
                                                Plat Nomor:
                                            </span>
                                            <span className="font-mono text-sm font-bold tracking-wider text-foreground">
                                                {sale.trade_in_license_plate}
                                            </span>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 gap-3 border-t border-purple-500/20 pt-3 sm:grid-cols-3">
                                        <div className="rounded-md border border-purple-500/10 bg-background/40 p-2.5">
                                            <div className="text-[11px] text-muted-foreground">
                                                Tahun Pembuatan:
                                            </div>
                                            <div className="mt-0.5 text-sm font-semibold text-foreground">
                                                {sale.trade_in_year ?? '—'}
                                            </div>
                                        </div>
                                        <div className="rounded-md border border-purple-500/10 bg-background/40 p-2.5">
                                            <div className="text-[11px] text-muted-foreground">
                                                Warna Kendaraan:
                                            </div>
                                            <div className="mt-0.5 text-sm font-semibold text-foreground capitalize">
                                                {sale.trade_in_color ?? '—'}
                                            </div>
                                        </div>
                                        <div className="rounded-md border border-purple-500/10 bg-background/40 p-2.5">
                                            <div className="text-[11px] text-muted-foreground">
                                                Jarak Tempuh:
                                            </div>
                                            <div className="mt-0.5 font-mono text-sm font-semibold text-foreground">
                                                {sale.trade_in_mileage !== null &&
                                                sale.trade_in_mileage !== undefined
                                                    ? `${sale.trade_in_mileage.toLocaleString('id-ID')} km`
                                                    : '—'}
                                            </div>
                                        </div>
                                    </div>

                                    {sale.trade_in_notes && (
                                        <div className="rounded-lg border border-purple-500/10 bg-background/40 p-2.5 text-muted-foreground">
                                            <span className="font-semibold text-foreground">
                                                Catatan Kondisi:{' '}
                                            </span>
                            {sale.trade_in_notes}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        <Card className="shadow-xs">
                            <CardSectionHeader
                                className="pb-3"
                                icon={
                                    <HandCoinsIcon
                                        className="size-4"
                                        weight="bold"
                                    />
                                }
                                iconClassName="bg-emerald-500/10 text-emerald-600"
                                title="Riwayat Pembayaran & Kas Masuk"
                                description="Daftar seluruh kuitansi pelunasan, uang muka (DP), dan pencairan leasing."
                                action={
                                    canAcceptPayment ? (
                                        <Button
                                            size="sm"
                                            onClick={() =>
                                                setIsPaymentOpen(true)
                                            }
                                            className="bg-emerald-600 text-white hover:bg-emerald-700"
                                        >
                                            <PlusIcon className="size-4" />
                                            Catat Kas Masuk
                                        </Button>
                                    ) : null
                                }
                            />
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader className="bg-muted/40">
                                        <TableRow>
                                            <TableHead className="w-12">
                                                #
                                            </TableHead>
                                            <TableHead>
                                                No. Kuitansi & Tgl
                                            </TableHead>
                                            <TableHead>
                                                Kategori & Pembayar
                                            </TableHead>
                                            <TableHead>
                                                Metode & Rekening
                                            </TableHead>
                                            <TableHead className="text-right">
                                                Nominal Masuk
                                            </TableHead>
                                            <TableHead className="w-12 text-center">
                                                Aksi
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {payments.length > 0 ? (
                                            payments.map((payment, idx) => (
                                                <TableRow key={payment.id}>
                                                    <TableCell className="font-mono text-xs text-muted-foreground">
                                                        {idx + 1}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="font-mono text-xs font-semibold text-primary">
                                                            {
                                                                payment.payment_number
                                                            }
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {formatDate(
                                                                payment.payment_date.slice(
                                                                    0,
                                                                    10,
                                                                ),
                                                                longDateOptions,
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="text-xs font-medium">
                                                            {getPaymentCategoryLabel(
                                                                payment.payment_category,
                                                            )}
                                                        </div>
                                                        <div className="text-[11px] text-muted-foreground capitalize">
                                                            Sumber:{' '}
                                                            {payment.payer_type ===
                                                            'finance'
                                                                ? (finance?.name ??
                                                                  'Leasing')
                                                                : (customer?.name ??
                                                                  'Customer')}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="text-xs font-medium capitalize">
                                                            {
                                                                payment.payment_method
                                                            }
                                                        </div>
                                                        <div className="max-w-40 truncate text-[11px] text-muted-foreground">
                                                            {
                                                                payment.destination_account
                                                            }
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div
                                                            className={`text-sm font-bold ${payment.payment_category === 'leasing_bonus' ? 'text-blue-600' : 'text-emerald-600'}`}
                                                        >
                                                            +
                                                            {formatCurrency(
                                                                payment.amount,
                                                            )}
                                                        </div>
                                                        {payment.payment_category ===
                                                            'leasing_bonus' && (
                                                            <div className="text-[10px] font-medium text-blue-500">
                                                                Bonus Komisi
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {(!sale.handover
                                                            ?.bpkb_delivered_at ||
                                                            payment.payment_category ===
                                                                'leasing_bonus') && (
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger
                                                                    asChild
                                                                >
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="size-7"
                                                                    >
                                                                        <DotsThreeVerticalIcon className="size-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end">
                                                                    <DropdownMenuItem
                                                                        onSelect={() =>
                                                                            void copyToClipboard(
                                                                                payment.payment_number,
                                                                                'Nomor kuitansi',
                                                                            )
                                                                        }
                                                                    >
                                                                        <CopyIcon />
                                                                        Salin
                                                                        no.
                                                                        kuitansi
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        className="text-red-500 focus:bg-red-500/10 focus:text-red-500 dark:focus:bg-red-500/20"
                                                                        onSelect={() =>
                                                                            setDeletingPayment(
                                                                                payment,
                                                                            )
                                                                        }
                                                                    >
                                                                        <TrashIcon className="text-red-500" />
                                                                        <span className="text-red-500">
                                                                            Hapus
                                                                            pembayaran
                                                                        </span>
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={6}
                                                    className="h-24 text-center text-sm text-muted-foreground"
                                                >
                                                    Belum ada riwayat pembayaran
                                                    yang tercatat.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        {/* Transaction Notes */}
                        {sale.notes && (
                            <Card className="shadow-xs">
                                <CardHeader className="py-3">
                                    <CardTitle className="text-sm">
                                        Catatan Transaksi
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0 text-sm text-muted-foreground">
                                    {sale.notes}
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Right Column: Car & Customer & Finance Details */}
                    <div className="space-y-6">
                        {/* Car Details Card */}
                        <Card className="shadow-xs">
                            <CardSectionHeader
                                className="pb-3"
                                icon={
                                    <CarProfileIcon
                                        className="size-4"
                                        weight="bold"
                                    />
                                }
                                title="Unit Mobil Terjual"
                                titleClassName="text-sm font-semibold"
                            />
                            <CardContent className="space-y-2 text-xs">
                                <div className="text-sm font-semibold text-foreground">
                                    {car?.name}
                                </div>
                                <div className="grid grid-cols-2 gap-2 pt-1">
                                    <div>
                                        <span className="text-muted-foreground">
                                            Merek:
                                        </span>{' '}
                                        <span className="font-medium text-foreground">
                                            {car?.brand?.name ?? '—'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">
                                            Plat:
                                        </span>{' '}
                                        <span className="font-mono font-medium text-foreground">
                                            {car?.license_plate ?? '—'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">
                                            Tahun:
                                        </span>{' '}
                                        <span className="font-medium text-foreground">
                                            {car?.year ?? '—'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">
                                            Warna:
                                        </span>{' '}
                                        <span className="font-medium text-foreground">
                                            {car?.color ?? '—'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">
                                            Transmisi:
                                        </span>{' '}
                                        <span className="font-medium text-foreground uppercase">
                                            {car?.transmission ?? '—'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">
                                            Bahan Bakar:
                                        </span>{' '}
                                        <span className="font-medium text-foreground capitalize">
                                            {car?.fuel_type ?? '—'}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Customer Buyer Card */}
                        <Card className="shadow-xs">
                            <CardSectionHeader
                                className="pb-3"
                                icon={
                                    <UserIcon
                                        className="size-4"
                                        weight="bold"
                                    />
                                }
                                iconClassName="bg-emerald-500/10 text-emerald-600"
                                title="Pembeli (Customer)"
                                titleClassName="text-sm font-semibold"
                            />
                            <CardContent className="space-y-2 text-xs">
                                <div className="text-sm font-semibold text-foreground">
                                    {customer?.name}
                                </div>
                                {customer?.phone && (
                                    <div className="flex items-center justify-between pt-1">
                                        <span className="font-mono text-muted-foreground">
                                            {customer.phone}
                                        </span>
                                        {whatsappLink && (
                                            <a
                                                href={whatsappLink}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 hover:underline"
                                            >
                                                <WhatsappLogoIcon className="size-3.5" />
                                                Chat WA
                                            </a>
                                        )}
                                    </div>
                                )}
                                {customer?.ktp_number && (
                                    <div className="text-muted-foreground">
                                        NIK:{' '}
                                        <span className="font-mono text-foreground">
                                            {customer.ktp_number}
                                        </span>
                                    </div>
                                )}
                                {customer?.address && (
                                    <div className="border-t pt-1 text-muted-foreground">
                                        {customer.address}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Leasing Details Card (if credit) */}
                        {sale.payment_type === 'credit' && (
                            <Card className="border-blue-500/20 bg-blue-500/5 shadow-xs dark:bg-blue-500/10">
                                <CardSectionHeader
                                    className="pb-3"
                                    icon={
                                        <BankIcon
                                            className="size-4"
                                            weight="bold"
                                        />
                                    }
                                    iconClassName="bg-blue-500/20 text-blue-600"
                                    title="Data Leasing (Finance)"
                                    titleClassName="text-sm font-semibold"
                                />
                                <CardContent className="space-y-2 text-xs">
                                    <div className="text-sm font-semibold text-foreground">
                                        {finance?.name ?? 'Lembaga Leasing'}
                                    </div>
                                    {finance?.pic_name && (
                                        <div className="text-muted-foreground">
                                            PIC:{' '}
                                            <span className="font-medium text-foreground">
                                                {finance.pic_name}
                                            </span>{' '}
                                            ({finance.pic_phone ?? '—'})
                                        </div>
                                    )}
                                    <div className="divide-y divide-blue-500/20 border-t border-blue-500/20 pt-2">
                                        <DataRow
                                            label="Pokok Leasing Disetujui"
                                            value={formatCurrency(
                                                sale.finance_amount,
                                            )}
                                            valueClassName="font-bold text-foreground"
                                        />
                                        <DataRow
                                            label="Sudah Diterima"
                                            value={formatCurrency(
                                                sale.total_finance_disbursed ??
                                                    0,
                                            )}
                                            valueClassName="font-semibold text-emerald-600 dark:text-emerald-400"
                                        />
                                        <DataRow
                                            label="Sisa Pencairan"
                                            value={formatCurrency(
                                                sale.remaining_finance_disbursement ??
                                                    sale.finance_amount,
                                            )}
                                            valueClassName="font-semibold text-amber-600 dark:text-amber-400"
                                        />
                                        <DataRow
                                            label="Estimasi Tanggal Cair"
                                            value={
                                                sale.disbursement_estimated_date
                                                    ? formatDate(
                                                          sale.disbursement_estimated_date.slice(
                                                              0,
                                                              10,
                                                          ),
                                                          longDateOptions,
                                                      )
                                                    : '—'
                                            }
                                        />
                                        {sale.disbursement_actual_date && (
                                            <DataRow
                                                label="Realisasi Cair"
                                                value={formatDate(
                                                    sale.disbursement_actual_date.slice(
                                                        0,
                                                        10,
                                                    ),
                                                    longDateOptions,
                                                )}
                                                valueClassName="font-semibold text-emerald-600 dark:text-emerald-400"
                                            />
                                        )}
                                        {sale.leasing_bonus > 0 && (
                                            <DataRow
                                                label="Bonus / Komisi Leasing"
                                                value={formatCurrency(
                                                    sale.leasing_bonus,
                                                )}
                                                valueClassName="font-semibold text-blue-600 dark:text-blue-400"
                                            />
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                        {/* Vehicle handover card */}
                        <Card className="border-primary/20 bg-primary/[0.02] shadow-xs">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                                            <KeyIcon
                                                className="size-4"
                                                weight="bold"
                                            />
                                        </div>
                                        <CardTitle className="text-sm">
                                            Penyerahan Unit
                                        </CardTitle>
                                    </div>
                                    {sale.handover && (
                                        <span className="font-mono text-[11px] font-semibold text-muted-foreground">
                                            {sale.handover.handover_number}
                                        </span>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3 text-xs">
                                {/* Status Unit */}
                                <div className="space-y-1 rounded-lg border bg-background p-2.5">
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium text-muted-foreground">
                                            Fisik Unit & STNK:
                                        </span>
                                        {sale.handover?.vehicle_delivered_at ? (
                                            <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                                                <CheckCircleIcon
                                                    className="size-3.5"
                                                    weight="fill"
                                                />
                                                Sudah Diserahkan
                                            </span>
                                        ) : canDeliverVehicle ? (
                                            <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                                                Siap Diserahkan
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 font-semibold text-red-500">
                                                Terkunci (Sisa &gt; 10jt)
                                            </span>
                                        )}
                                    </div>
                                    {sale.handover?.vehicle_delivered_at ? (
                                        <div className="text-[11px] text-muted-foreground">
                                            Diserahkan pada{' '}
                                            {formatDate(
                                                sale.handover
                                                    .vehicle_delivered_at,
                                                longDateOptions,
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-[11px] text-muted-foreground">
                                            {sale.payment_type === 'credit'
                                                ? canDeliverVehicle
                                                    ? 'Kekurangan customer ≤ Rp 10 Juta; sisa pokok leasing tidak mengunci unit.'
                                                    : 'Kekurangan customer > Rp 10 Juta, unit belum dapat diserahkan.'
                                                : canDeliverVehicle
                                                  ? 'Sisa piutang ≤ Rp 10 Juta, unit boleh dibawa pulang.'
                                                  : 'Sisa piutang > Rp 10 Juta, unit belum dapat diserahkan.'}
                                        </div>
                                    )}
                                </div>

                                {/* Status BPKB */}
                                <div className="space-y-1 rounded-lg border bg-background p-2.5">
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium text-muted-foreground">
                                            Dokumen BPKB Asli:
                                        </span>
                                        {sale.handover?.bpkb_delivered_at ? (
                                            <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                                                <ShieldCheckIcon
                                                    className="size-3.5"
                                                    weight="fill"
                                                />
                                                Sudah Diserahkan
                                            </span>
                                        ) : canDeliverBpkb ? (
                                            <span className="inline-flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400">
                                                {sale.payment_type === 'credit'
                                                    ? 'Siap Diserahkan ke Leasing'
                                                    : 'Siap Diserahkan (Lunas)'}
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
                                                Ditahan di Showroom
                                            </span>
                                        )}
                                    </div>
                                    {sale.handover?.bpkb_delivered_at ? (
                                        <div className="text-[11px] text-muted-foreground">
                                            Diserahkan ke{' '}
                                            {sale.handover
                                                .bpkb_recipient_type ===
                                            'finance_company'
                                                ? 'Lembaga Leasing'
                                                : 'Customer'}
                                        </div>
                                    ) : (
                                        <div className="text-[11px] text-muted-foreground">
                                            {sale.payment_type === 'credit'
                                                ? 'Saat BPKB diserahkan kepada petugas leasing, sisa pokok leasing otomatis dicatat sebagai pembayaran sah.'
                                                : 'BPKB baru dapat diserahkan setelah pembayaran lunas 100%.'}
                                        </div>
                                    )}
                                </div>

                                {/* Recipient info */}
                                {sale.handover && latestHandoverEvent && (
                                    <div className="space-y-1 border-t pt-2 text-[11px] text-muted-foreground">
                                        <div>
                                            Tracking terakhir:{' '}
                                            <strong className="text-foreground">
                                                {
                                                    latestHandoverEvent.recipient_name
                                                }
                                            </strong>
                                            {' menerima '}
                                            {latestHandoverEvent.items
                                                .map((item) => item.item_name)
                                                .join(', ')}
                                        </div>
                                        <div>
                                            Lokasi:{' '}
                                            <span className="text-foreground">
                                                {
                                                    latestHandoverEvent.handover_location
                                                }
                                            </span>
                                        </div>
                                        <div>
                                            Total riwayat:{' '}
                                            <span className="font-medium text-foreground">
                                                {handoverEvents.length} kejadian
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex flex-wrap items-center gap-2 pt-1">
                                    {sale.handover && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            asChild
                                            className="flex-1 text-xs"
                                        >
                                            <Link
                                                href={VehicleHandoverController.show.url(
                                                    sale.id,
                                                )}
                                            >
                                                Lihat Tracking
                                            </Link>
                                        </Button>
                                    )}
                                    {canAddTracking ? (
                                        <Button
                                            size="sm"
                                            asChild
                                            className="flex-1 text-xs"
                                        >
                                            <Link
                                                href={VehicleHandoverController.create.url(
                                                    sale.id,
                                                )}
                                            >
                                                Tambah Tracking
                                            </Link>
                                        </Button>
                                    ) : (
                                        <Button
                                            size="sm"
                                            className="flex-1 text-xs"
                                            disabled
                                        >
                                            Menunggu Pembayaran
                                        </Button>
                                    )}
                                    {sale.handover?.vehicle_delivered_at && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            asChild
                                            className="text-xs"
                                        >
                                            <Link
                                                href={VehicleHandoverController.printBast.url(
                                                    sale.id,
                                                )}
                                            >
                                                <PrinterIcon className="size-3.5" />
                                                Cetak BAST
                                            </Link>
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </PageContainer>

            {/* Payment Dialog */}
            <PaymentDialog
                open={isPaymentOpen}
                sale={sale}
                onOpenChange={setIsPaymentOpen}
            />

            {/* Delete Payment Dialog */}
            <ConfirmDialog
                open={deletingPayment !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setDeletingPayment(null);
                    }
                }}
                tone="danger"
                title="Hapus Catatan Pembayaran?"
                description={
                    <>
                        Apakah Anda yakin ingin menghapus kuitansi pembayaran{' '}
                        <strong>{deletingPayment?.payment_number}</strong> sebesar{' '}
                        <strong>
                            {deletingPayment
                                ? formatCurrency(deletingPayment.amount)
                                : ''}
                        </strong>
                        ? Sisa piutang penjualan akan dihitung ulang secara otomatis.
                    </>
                }
                confirmText="Ya, Hapus Pembayaran"
                confirmIcon={TrashIcon}
                formProps={
                    deletingPayment
                        ? {
                              action: PaymentController.destroy.url(
                                  deletingPayment.id,
                              ),
                              method: 'delete',
                              options: { preserveScroll: true },
                              onSuccess: () => setDeletingPayment(null),
                          }
                        : undefined
                }
            />
        </>
    );
}

SalesShow.layout = {
    breadcrumbs: [
        {
            title: 'Penjualan',
            href: salesIndex.url(),
        },
        {
            title: 'Detail SPK',
            href: '#',
        },
    ],
};

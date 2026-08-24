import { Form, Head, Link } from '@inertiajs/react';
import {
    ArrowLeftIcon,
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
    WarningIcon,
    WhatsappLogoIcon,
} from '@phosphor-icons/react';
import { useState } from 'react';
import { toast } from 'sonner';
import PaymentController from '@/actions/App/Http/Controllers/PaymentController';
import VehicleHandoverController from '@/actions/App/Http/Controllers/VehicleHandoverController';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
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
import { HandoverDialog } from '@/pages/sales/handover-dialog';
import { PaymentDialog } from '@/pages/sales/payment-dialog';
import { getPaymentTypeBadge } from '@/pages/sales/table-config';
import type { Payment, Sale } from '@/pages/sales/types';
import { index as salesIndex } from '@/routes/sales';

type Props = {
    sale: Sale;
};

const currencyFormatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
});

async function copyText(value: string, label: string) {
    try {
        await navigator.clipboard.writeText(value);
        toast.success(`${label} berhasil disalin.`);
    } catch {
        toast.error(`${label} gagal disalin.`);
    }
}

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
    const [isHandoverOpen, setIsHandoverOpen] = useState(false);
    const [deletingPayment, setDeletingPayment] = useState<Payment | null>(
        null,
    );

    const car = sale.car;
    const customer = sale.customer;
    const finance = sale.finance_company;
    const payments = sale.payments ?? [];

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
        sale.remaining_bill ?? Math.max(0, sale.deal_price - totalPaid);
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
        sale.can_deliver_vehicle ?? remainingBill <= 10_000_000;
    const canAcceptPayment =
        sale.can_accept_payment ??
        (remainingBill > 0 ||
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

            <div className="flex h-full min-w-0 flex-1 flex-col gap-6 p-4 md:p-6">
                {/* Top Action Bar */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="icon" asChild>
                            <Link
                                href={salesIndex.url()}
                                aria-label="Kembali ke daftar penjualan"
                            >
                                <ArrowLeftIcon className="size-4" />
                            </Link>
                        </Button>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="font-mono text-xl font-bold tracking-tight">
                                    {sale.invoice_number}
                                </h1>
                                <StatusBadge status={sale.status} />
                                {getPaymentTypeBadge(
                                    sale.payment_type,
                                    finance?.name,
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Dibuat pada{' '}
                                {dateFormatter.format(
                                    new Date(sale.created_at),
                                )}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
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
                    </div>
                </div>

                {/* 4 KPI Financial Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="p-4 shadow-xs">
                        <div className="text-xs font-medium text-muted-foreground">
                            Harga Kesepakatan (Deal)
                        </div>
                        <div className="mt-1 text-xl font-bold text-foreground">
                            {currencyFormatter.format(sale.deal_price)}
                        </div>
                        <div className="mt-0.5 text-[11px] text-muted-foreground">
                            Harga Jual Unit
                        </div>
                    </Card>

                    <Card className="p-4 shadow-xs">
                        <div className="text-xs font-medium text-muted-foreground">
                            Total Uang Masuk
                        </div>
                        <div className="mt-1 text-xl font-bold text-emerald-600 dark:text-emerald-500">
                            {currencyFormatter.format(totalPaid)}
                        </div>
                        <div className="mt-0.5 text-[11px] text-emerald-600/80">
                            {isSettled
                                ? '✓ Lunas 100%'
                                : `${Math.round((totalPaid / sale.deal_price) * 100)}% dari total tagihan`}
                        </div>
                    </Card>

                    <Card className="p-4 shadow-xs">
                        <div className="text-xs font-medium text-muted-foreground">
                            Sisa Piutang Showroom
                        </div>
                        <div
                            className={`mt-1 text-xl font-bold ${isSettled ? 'text-emerald-600 dark:text-emerald-500' : 'text-amber-600 dark:text-amber-500'}`}
                        >
                            {currencyFormatter.format(remainingBill)}
                        </div>
                        <div className="mt-0.5 text-[11px] text-muted-foreground">
                            {isSettled
                                ? 'Tidak ada tagihan tertunda'
                                : sale.payment_type === 'credit'
                                  ? 'Menunggu pencairan leasing'
                                  : 'Menunggu pelunasan tempo'}
                        </div>
                    </Card>

                    <Card className="p-4 shadow-xs">
                        <div className="text-xs font-medium text-muted-foreground">
                            {sale.payment_type === 'credit'
                                ? 'Bonus Leasing & Estimasi Margin'
                                : 'Estimasi Margin Laba'}
                        </div>
                        <div className="mt-1 text-xl font-bold text-blue-600 dark:text-blue-500">
                            {currencyFormatter.format(estimatedProfit)}
                        </div>
                        <div className="mt-0.5 text-[11px] text-muted-foreground">
                            {sale.leasing_bonus > 0
                                ? `Termasuk bonus Rp ${currencyFormatter.format(sale.leasing_bonus)}`
                                : `Modal beli: ${currencyFormatter.format(purchasePrice)}`}
                        </div>
                    </Card>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Left 2 Columns: Payment History Ledger */}
                    <div className="space-y-6 lg:col-span-2">
                        <Card className="shadow-xs">
                            <CardHeader className="flex flex-row items-center justify-between pb-3">
                                <div>
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <HandCoinsIcon className="size-5 text-emerald-600" />
                                        Riwayat Pembayaran & Kas Masuk
                                    </CardTitle>
                                    <CardDescription>
                                        Daftar seluruh kuitansi pelunasan, uang
                                        muka (DP), dan pencairan leasing.
                                    </CardDescription>
                                </div>
                                {canAcceptPayment && (
                                    <Button
                                        size="sm"
                                        onClick={() => setIsPaymentOpen(true)}
                                        className="bg-emerald-600 text-white hover:bg-emerald-700"
                                    >
                                        <PlusIcon className="size-4" />
                                        Catat Kas Masuk
                                    </Button>
                                )}
                            </CardHeader>
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
                                                            {dateFormatter.format(
                                                                new Date(
                                                                    payment.payment_date,
                                                                ),
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
                                                            {currencyFormatter.format(
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
                                                                        void copyText(
                                                                            payment.payment_number,
                                                                            'Nomor kuitansi',
                                                                        )
                                                                    }
                                                                >
                                                                    <CopyIcon />
                                                                    Salin no.
                                                                    kuitansi
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    className="text-red-500 focus:text-red-500"
                                                                    onSelect={() =>
                                                                        setDeletingPayment(
                                                                            payment,
                                                                        )
                                                                    }
                                                                >
                                                                    <TrashIcon />
                                                                    Hapus
                                                                    pembayaran
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
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
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-2">
                                    <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                                        <CarProfileIcon
                                            className="size-4"
                                            weight="bold"
                                        />
                                    </div>
                                    <CardTitle className="text-sm">
                                        Unit Mobil Terjual
                                    </CardTitle>
                                </div>
                            </CardHeader>
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
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-2">
                                    <div className="flex size-7 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600">
                                        <UserIcon
                                            className="size-4"
                                            weight="bold"
                                        />
                                    </div>
                                    <CardTitle className="text-sm">
                                        Pembeli (Customer)
                                    </CardTitle>
                                </div>
                            </CardHeader>
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
                                <CardHeader className="pb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="flex size-7 items-center justify-center rounded-md bg-blue-500/20 text-blue-600">
                                            <BankIcon
                                                className="size-4"
                                                weight="bold"
                                            />
                                        </div>
                                        <CardTitle className="text-sm">
                                            Data Leasing (Finance)
                                        </CardTitle>
                                    </div>
                                </CardHeader>
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
                                    <div className="space-y-1.5 divide-y border-t border-blue-500/20 pt-2">
                                        <div className="flex items-center justify-between pt-1 text-muted-foreground">
                                            <span>Pokok Cair Leasing:</span>
                                            <span className="font-bold text-foreground">
                                                {currencyFormatter.format(
                                                    sale.finance_amount,
                                                )}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between pt-1.5 text-muted-foreground">
                                            <span>Estimasi Tanggal Cair:</span>
                                            <span className="font-medium text-foreground">
                                                {sale.disbursement_estimated_date
                                                    ? dateFormatter.format(
                                                          new Date(
                                                              sale.disbursement_estimated_date,
                                                          ),
                                                      )
                                                    : '—'}
                                            </span>
                                        </div>
                                        {sale.disbursement_actual_date && (
                                            <div className="flex items-center justify-between pt-1.5 text-emerald-600">
                                                <span>Realisasi Cair:</span>
                                                <span className="font-semibold">
                                                    {dateFormatter.format(
                                                        new Date(
                                                            sale.disbursement_actual_date,
                                                        ),
                                                    )}
                                                </span>
                                            </div>
                                        )}
                                        {sale.leasing_bonus > 0 && (
                                            <div className="flex items-center justify-between pt-1.5 font-semibold text-blue-600 dark:text-blue-400">
                                                <span>
                                                    Bonus / Komisi Leasing:
                                                </span>
                                                <span>
                                                    {currencyFormatter.format(
                                                        sale.leasing_bonus,
                                                    )}
                                                </span>
                                            </div>
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
                                            {dateFormatter.format(
                                                new Date(
                                                    sale.handover
                                                        .vehicle_delivered_at,
                                                ),
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-[11px] text-muted-foreground">
                                            {canDeliverVehicle
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
                                        ) : isSettled ? (
                                            <span className="inline-flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400">
                                                Siap Diserahkan (Lunas)
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
                                            BPKB baru dapat diserahkan setelah
                                            pembayaran lunas 100%.
                                        </div>
                                    )}
                                </div>

                                {/* Recipient info */}
                                {sale.handover && (
                                    <div className="space-y-1 border-t pt-2 text-[11px] text-muted-foreground">
                                        <div>
                                            Penerima:{' '}
                                            <strong className="text-foreground">
                                                {sale.handover.recipient_name}
                                            </strong>{' '}
                                            (
                                            {sale.handover
                                                .recipient_relation ===
                                            'buyer_self'
                                                ? 'Pembeli Sendiri'
                                                : sale.handover
                                                      .recipient_relation}
                                            )
                                        </div>
                                        <div>
                                            Lokasi:{' '}
                                            <span className="text-foreground">
                                                {
                                                    sale.handover
                                                        .handover_location
                                                }
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex items-center gap-2 pt-1">
                                    <Button
                                        variant={
                                            sale.handover
                                                ? 'outline'
                                                : 'default'
                                        }
                                        size="sm"
                                        className="flex-1 text-xs"
                                        disabled={
                                            !sale.handover && !canDeliverVehicle
                                        }
                                        onClick={() => setIsHandoverOpen(true)}
                                    >
                                        {sale.handover
                                            ? 'Perbarui Penyerahan'
                                            : canDeliverVehicle
                                              ? 'Catat Penyerahan'
                                              : 'Menunggu Pembayaran'}
                                    </Button>
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
            </div>

            {isHandoverOpen && (
                <HandoverDialog
                    open={isHandoverOpen}
                    sale={sale}
                    onOpenChange={setIsHandoverOpen}
                />
            )}

            {/* Payment Dialog */}
            <PaymentDialog
                open={isPaymentOpen}
                sale={sale}
                onOpenChange={setIsPaymentOpen}
            />

            {/* Delete Payment Dialog */}
            <Dialog
                open={deletingPayment !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setDeletingPayment(null);
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <div className="mb-1 flex size-10 items-center justify-center rounded-full bg-red-500/10 text-red-500">
                            <WarningIcon className="size-5" weight="fill" />
                        </div>
                        <DialogTitle>Hapus Catatan Pembayaran?</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus kuitansi
                            pembayaran{' '}
                            <strong>{deletingPayment?.payment_number}</strong>{' '}
                            sebesar{' '}
                            <strong>
                                {deletingPayment
                                    ? currencyFormatter.format(
                                          deletingPayment.amount,
                                      )
                                    : ''}
                            </strong>
                            ? Sisa piutang penjualan akan dihitung ulang secara
                            otomatis.
                        </DialogDescription>
                    </DialogHeader>

                    {deletingPayment && (
                        <Form
                            action={PaymentController.destroy.url(
                                deletingPayment.id,
                            )}
                            method="delete"
                            options={{ preserveScroll: true }}
                            onSuccess={() => setDeletingPayment(null)}
                        >
                            {({ processing }) => (
                                <DialogFooter>
                                    <DialogClose asChild>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            disabled={processing}
                                        >
                                            Batal
                                        </Button>
                                    </DialogClose>
                                    <Button
                                        type="submit"
                                        variant="destructive"
                                        disabled={processing}
                                    >
                                        {processing ? (
                                            <Spinner />
                                        ) : (
                                            <TrashIcon />
                                        )}
                                        Ya, Hapus Pembayaran
                                    </Button>
                                </DialogFooter>
                            )}
                        </Form>
                    )}
                </DialogContent>
            </Dialog>
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

import { Form, Link } from '@inertiajs/react';
import {
    BankIcon,
    BuildingsIcon,
    CalendarBlankIcon,
    CarProfileIcon,
    CheckCircleIcon,
    CoinsIcon,
    CreditCardIcon,
    CurrencyCircleDollarIcon,
    FloppyDiskIcon,
    MoneyIcon,
    UserIcon,
} from '@phosphor-icons/react';
import { useState } from 'react';
import SaleController from '@/actions/App/Http/Controllers/SaleController';
import InputError from '@/components/input-error';
import { PriceInput } from '@/components/price-input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import type { Car } from '@/pages/cars/types';
import type { Customer } from '@/pages/customers/types';
import type {
    FinanceCompany,
    PaymentMethod,
    PaymentType,
} from '@/pages/sales/types';
import { index as salesIndex } from '@/routes/sales';

type Props = {
    availableCars: Car[];
    customers: Pick<Customer, 'id' | 'name' | 'phone' | 'ktp_number'>[];
    financeCompanies: FinanceCompany[];
};

const currencyFormatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
});

const validationColorClassName =
    'aria-invalid:border-red-500 aria-invalid:ring-red-500/20 dark:aria-invalid:ring-red-500/40';
const errorTextClassName = 'text-red-500 dark:text-red-500';

export function SaleForm({
    availableCars,
    customers,
    financeCompanies,
}: Props) {
    const [selectedCarId, setSelectedCarId] = useState<string>(
        availableCars[0]?.id ? String(availableCars[0].id) : '',
    );
    const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
        customers[0]?.id ? String(customers[0].id) : '',
    );
    const [paymentType, setPaymentType] = useState<PaymentType>('cash_full');

    const selectedCar = availableCars.find((c) => String(c.id) === selectedCarId);

    const [dealPrice, setDealPrice] = useState<string>(
        selectedCar?.selling_price ? String(selectedCar.selling_price) : '',
    );
    const [downPayment, setDownPayment] = useState<string>('');
    const [financeCompanyId, setFinanceCompanyId] = useState<string>(
        financeCompanies[0]?.id ? String(financeCompanies[0].id) : '',
    );
    const [disbursementEstDate, setDisbursementEstDate] = useState<string>(
        new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    );
    const [leasingBonus, setLeasingBonus] = useState<string>('3000000');
    const [dueDate, setDueDate] = useState<string>(
        new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    );
    const [recordInitialPayment, setRecordInitialPayment] = useState(true);
    const [paymentDate, setPaymentDate] = useState<string>(
        new Date().toISOString().split('T')[0],
    );
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('transfer');
    const [destinationAccount, setDestinationAccount] = useState<string>(
        'BCA Showroom (0123-456-789)',
    );
    const [referenceNumber, setReferenceNumber] = useState<string>('');
    const [notes, setNotes] = useState<string>('');

    // Handle car selection change & sync deal price
    function handleCarChange(newCarId: string) {
        setSelectedCarId(newCarId);
        const car = availableCars.find((c) => String(c.id) === newCarId);
        if (car?.selling_price) {
            setDealPrice(String(car.selling_price));
            if (paymentType === 'cash_tempo' || paymentType === 'credit') {
                const defaultDp = Math.round(car.selling_price * 0.2);
                setDownPayment(String(defaultDp));
            }
        }
    }

    function handlePaymentTypeChange(type: PaymentType) {
        setPaymentType(type);
        const numDeal = Number(dealPrice) || 0;
        if (type === 'cash_full') {
            setDownPayment(String(numDeal));
        } else if (type === 'cash_tempo' || type === 'credit') {
            const defaultDp = Math.round(numDeal * 0.2);
            setDownPayment(String(defaultDp));
        }
    }

    const numDealPrice = Number(dealPrice) || 0;
    const numDownPayment = Number(downPayment) || 0;
    const numFinanceAmount = Math.max(0, numDealPrice - numDownPayment);
    const numRemainingTempo = Math.max(0, numDealPrice - numDownPayment);
    const numLeasingBonus = Number(leasingBonus) || 0;
    const selectedFinanceCompany = financeCompanies.find(
        (fc) => String(fc.id) === financeCompanyId,
    );

    return (
        <Form
            action={SaleController.store.url()}
            method="post"
            options={{ preserveScroll: true }}
            className="space-y-6"
        >
            {({ processing, errors }) => (
                <>
                    <input type="hidden" name="car_id" value={selectedCarId} />
                    <input type="hidden" name="customer_id" value={selectedCustomerId} />
                    <input type="hidden" name="payment_type" value={paymentType} />
                    <input type="hidden" name="payment_method" value={paymentMethod} />
                    <input
                        type="hidden"
                        name="record_initial_payment"
                        value={recordInitialPayment ? '1' : '0'}
                    />
                    {paymentType === 'credit' && (
                        <>
                            <input type="hidden" name="finance_company_id" value={financeCompanyId} />
                            <input type="hidden" name="finance_amount" value={String(numFinanceAmount)} />
                        </>
                    )}

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        {/* Left 2 Columns: Main Input Form */}
                        <div className="space-y-6 lg:col-span-2">
                            {/* Section 1: Unit & Customer */}
                            <Card className="shadow-xs">
                                <CardHeader>
                                    <div className="flex items-center gap-2">
                                        <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                            <CarProfileIcon className="size-4" weight="bold" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-base">Unit Mobil & Pembeli</CardTitle>
                                            <CardDescription>
                                                Pilih unit mobil yang dijual dan data customer pembeli.
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    {/* Select Car */}
                                    <div className="grid gap-2 sm:col-span-2">
                                        <Label htmlFor="sale-car">Pilih Unit Mobil Tersedia</Label>
                                        {availableCars.length > 0 ? (
                                            <Select value={selectedCarId} onValueChange={handleCarChange}>
                                                <SelectTrigger id="sale-car" className={errors.car_id ? validationColorClassName : ''}>
                                                    <SelectValue placeholder="Pilih mobil..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {availableCars.map((car) => (
                                                        <SelectItem key={car.id} value={String(car.id)}>
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-semibold">{car.name}</span>
                                                                {car.license_plate && (
                                                                    <span className="font-mono text-xs text-muted-foreground">({car.license_plate})</span>
                                                                )}
                                                                <span>• {car.year}</span>
                                                                <span className="text-emerald-600 font-medium ml-auto">
                                                                    {currencyFormatter.format(car.selling_price)}
                                                                </span>
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                                                Tidak ada mobil berstatus tersedia. Silakan tambah unit mobil baru terlebih dahulu.
                                            </div>
                                        )}
                                        <InputError message={errors.car_id} className={errorTextClassName} />
                                    </div>

                                    {/* Select Customer */}
                                    <div className="grid gap-2 sm:col-span-2">
                                        <Label htmlFor="sale-customer">Pilih Customer Pembeli</Label>
                                        <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                                            <SelectTrigger id="sale-customer" className={errors.customer_id ? validationColorClassName : ''}>
                                                <SelectValue placeholder="Pilih customer..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {customers.map((customer) => (
                                                    <SelectItem key={customer.id} value={String(customer.id)}>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium">{customer.name}</span>
                                                            {customer.phone && (
                                                                <span className="font-mono text-xs text-muted-foreground">({customer.phone})</span>
                                                            )}
                                                            {customer.ktp_number && (
                                                                <span className="text-xs text-muted-foreground">• NIK: {customer.ktp_number}</span>
                                                            )}
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.customer_id} className={errorTextClassName} />
                                    </div>

                                    {/* Deal Price */}
                                    <div className="grid gap-2 sm:col-span-2">
                                        <Label htmlFor="deal_price">Harga Kesepakatan Deal</Label>
                                        <PriceInput
                                            id="deal_price"
                                            name="deal_price"
                                            value={dealPrice}
                                            onValueChange={setDealPrice}
                                            placeholder="0"
                                            required
                                            aria-invalid={Boolean(errors.deal_price)}
                                            className={validationColorClassName}
                                        />
                                        <InputError message={errors.deal_price} className={errorTextClassName} />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Section 2: Payment Scheme */}
                            <Card className="shadow-xs">
                                <CardHeader>
                                    <div className="flex items-center gap-2">
                                        <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-500">
                                            <CurrencyCircleDollarIcon className="size-4" weight="bold" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-base">Skema Pembayaran</CardTitle>
                                            <CardDescription>
                                                Tentukan metode pembayaran: Tunai Lunas, Tunai Tempo, atau Kredit Leasing.
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Payment Type Selection Buttons */}
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                        <button
                                            type="button"
                                            onClick={() => handlePaymentTypeChange('cash_full')}
                                            className={`flex flex-col items-start gap-1 rounded-xl border p-4 text-left transition-all ${
                                                paymentType === 'cash_full'
                                                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20 dark:bg-primary/10'
                                                    : 'hover:bg-muted/50'
                                            }`}
                                        >
                                            <div className="flex items-center gap-1.5 font-semibold text-sm">
                                                <MoneyIcon className="size-4 text-emerald-600" />
                                                Tunai Lunas
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                Pembayaran penuh 100% lunas saat transaksi.
                                            </div>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handlePaymentTypeChange('cash_tempo')}
                                            className={`flex flex-col items-start gap-1 rounded-xl border p-4 text-left transition-all ${
                                                paymentType === 'cash_tempo'
                                                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20 dark:bg-primary/10'
                                                    : 'hover:bg-muted/50'
                                            }`}
                                        >
                                            <div className="flex items-center gap-1.5 font-semibold text-sm">
                                                <CalendarBlankIcon className="size-4 text-amber-600" />
                                                Tunai Tempo
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                DP / Booking fee + Jatuh tempo pelunasan.
                                            </div>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handlePaymentTypeChange('credit')}
                                            className={`flex flex-col items-start gap-1 rounded-xl border p-4 text-left transition-all ${
                                                paymentType === 'credit'
                                                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20 dark:bg-primary/10'
                                                    : 'hover:bg-muted/50'
                                            }`}
                                        >
                                            <div className="flex items-center gap-1.5 font-semibold text-sm">
                                                <CreditCardIcon className="size-4 text-blue-600" />
                                                Kredit Leasing
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                DP Customer + Pencairan Pokok & Bonus Finance.
                                            </div>
                                        </button>
                                    </div>

                                    {/* Dynamic Fields for Cash Tempo */}
                                    {paymentType === 'cash_tempo' && (
                                        <div className="grid grid-cols-1 gap-4 rounded-xl border bg-amber-500/5 p-4 sm:grid-cols-2 dark:bg-amber-500/10">
                                            <div className="grid gap-2">
                                                <Label htmlFor="down_payment">Uang Muka / Booking Fee (DP)</Label>
                                                <PriceInput
                                                    id="down_payment"
                                                    name="down_payment"
                                                    value={downPayment}
                                                    onValueChange={setDownPayment}
                                                    placeholder="0"
                                                    required
                                                    aria-invalid={Boolean(errors.down_payment)}
                                                    className={validationColorClassName}
                                                />
                                                <InputError message={errors.down_payment} className={errorTextClassName} />
                                            </div>

                                            <div className="grid gap-2">
                                                <Label htmlFor="due_date">Tanggal Jatuh Tempo Pelunasan</Label>
                                                <Input
                                                    id="due_date"
                                                    name="due_date"
                                                    type="date"
                                                    value={dueDate}
                                                    onChange={(e) => setDueDate(e.target.value)}
                                                    required
                                                    aria-invalid={Boolean(errors.due_date)}
                                                    className={validationColorClassName}
                                                />
                                                <InputError message={errors.due_date} className={errorTextClassName} />
                                            </div>

                                            <div className="sm:col-span-2 text-xs text-amber-700 dark:text-amber-400 font-medium">
                                                Sisa piutang yang harus dilunasi customer: <strong>{currencyFormatter.format(numRemainingTempo)}</strong>
                                            </div>
                                        </div>
                                    )}

                                    {/* Dynamic Fields for Credit (Leasing) */}
                                    {paymentType === 'credit' && (
                                        <div className="space-y-5 rounded-2xl border border-blue-500/30 bg-blue-500/5 p-5 dark:bg-blue-500/10">
                                            {/* Header of Leasing Section */}
                                            <div className="flex items-center justify-between border-b border-blue-500/20 pb-3">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="flex size-7 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs">
                                                        <BankIcon className="size-4" weight="bold" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-semibold text-foreground">
                                                            Detail Pembiayaan Kredit (Leasing)
                                                        </h4>
                                                        <p className="text-xs text-muted-foreground">
                                                            Pengaturan lembaga finance, porsi DP customer, dan estimasi pencairan.
                                                        </p>
                                                    </div>
                                                </div>
                                                {selectedFinanceCompany && (
                                                    <Badge variant="secondary" className="bg-blue-500/10 text-blue-700 dark:text-blue-400 font-mono text-xs">
                                                        {selectedFinanceCompany.code ?? selectedFinanceCompany.name}
                                                    </Badge>
                                                )}
                                            </div>

                                            {/* 1. Pilih Lembaga Finance */}
                                            <div className="space-y-2">
                                                <Label htmlFor="finance_company_id" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                                    1. Mitra Lembaga Pembiayaan
                                                </Label>
                                                <Select value={financeCompanyId} onValueChange={setFinanceCompanyId}>
                                                    <SelectTrigger id="finance_company_id" className="bg-background">
                                                        <SelectValue placeholder="Pilih leasing..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {financeCompanies.map((fc) => (
                                                            <SelectItem key={fc.id} value={String(fc.id)}>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-medium">{fc.name}</span>
                                                                    {fc.pic_name && (
                                                                        <span className="text-xs text-muted-foreground">• PIC: {fc.pic_name} ({fc.pic_phone ?? '—'})</span>
                                                                    )}
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <InputError message={errors.finance_company_id} className={errorTextClassName} />

                                                {/* PIC Info Card */}
                                                {selectedFinanceCompany && (
                                                    <div className="mt-2 flex flex-wrap items-center justify-between rounded-xl border border-blue-500/20 bg-background/80 px-3.5 py-2.5 text-xs text-muted-foreground">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium text-foreground">PIC Marketing:</span>
                                                            <span>{selectedFinanceCompany.pic_name ?? '—'}</span>
                                                            {selectedFinanceCompany.pic_phone && (
                                                                <span className="font-mono text-primary">({selectedFinanceCompany.pic_phone})</span>
                                                            )}
                                                        </div>
                                                        {selectedFinanceCompany.notes && (
                                                            <div className="text-[11px] italic text-muted-foreground/80 max-w-sm truncate">
                                                                {selectedFinanceCompany.notes}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* 2. Porsi Nilai Kredit & Uang Muka (DP) */}
                                            <div className="space-y-3 pt-1">
                                                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                                    2. Skema DP Customer & Pokok Hutang Leasing
                                                </Label>

                                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                                    {/* DP Customer */}
                                                    <div className="space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <Label htmlFor="down_payment_credit">DP Disetor Customer</Label>
                                                            {numDealPrice > 0 && (
                                                                <span className="text-xs font-medium text-muted-foreground">
                                                                    {numDealPrice > 0 ? Math.round((numDownPayment / numDealPrice) * 100) : 0}% dari Deal
                                                                </span>
                                                            )}
                                                        </div>
                                                        <PriceInput
                                                            id="down_payment_credit"
                                                            name="down_payment"
                                                            value={downPayment}
                                                            onValueChange={setDownPayment}
                                                            placeholder="0"
                                                            required
                                                            aria-invalid={Boolean(errors.down_payment)}
                                                            className={`bg-background ${validationColorClassName}`}
                                                        />
                                                        {/* Quick percentage buttons */}
                                                        <div className="flex items-center gap-1.5 pt-1">
                                                            <span className="text-[11px] text-muted-foreground">Preset:</span>
                                                            {[15, 20, 25, 30].map((pct) => (
                                                                <Button
                                                                    key={pct}
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="h-6 px-2 text-[11px] bg-background hover:bg-blue-500/10 hover:text-blue-600"
                                                                    onClick={() => {
                                                                        if (numDealPrice > 0) {
                                                                            setDownPayment(String(Math.round((numDealPrice * pct) / 100)));
                                                                        }
                                                                    }}
                                                                >
                                                                    {pct}%
                                                                </Button>
                                                            ))}
                                                        </div>
                                                        <InputError message={errors.down_payment} className={errorTextClassName} />
                                                    </div>

                                                    {/* Pokok Pencairan Leasing */}
                                                    <div className="space-y-2">
                                                        <Label htmlFor="finance_amount">Pokok Ditalangi / Dicairkan Leasing</Label>
                                                        <div className="relative">
                                                            <Input
                                                                id="finance_amount"
                                                                value={currencyFormatter.format(numFinanceAmount)}
                                                                readOnly
                                                                className="bg-muted/70 font-semibold text-blue-600 dark:text-blue-400 tabular-nums"
                                                            />
                                                        </div>
                                                        <p className="text-[11px] text-muted-foreground pt-1">
                                                            Otomatis: <strong className="text-foreground">{currencyFormatter.format(numDealPrice)}</strong> (Deal) - <strong className="text-foreground">{currencyFormatter.format(numDownPayment)}</strong> (DP)
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* 3. Jadwal Pencairan & Bonus Showroom */}
                                            <div className="space-y-3 pt-1">
                                                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                                    3. Jadwal Pencairan & Komisi Showroom
                                                </Label>

                                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                                    {/* Estimasi Tanggal Cair */}
                                                    <div className="grid gap-2">
                                                        <Label htmlFor="disbursement_estimated_date">Estimasi Tanggal Cair Leasing</Label>
                                                        <Input
                                                            id="disbursement_estimated_date"
                                                            name="disbursement_estimated_date"
                                                            type="date"
                                                            value={disbursementEstDate}
                                                            onChange={(e) => setDisbursementEstDate(e.target.value)}
                                                            required
                                                            aria-invalid={Boolean(errors.disbursement_estimated_date)}
                                                            className={`bg-background ${validationColorClassName}`}
                                                        />
                                                        <InputError message={errors.disbursement_estimated_date} className={errorTextClassName} />
                                                    </div>

                                                    {/* Bonus Leasing Showroom */}
                                                    <div className="grid gap-2">
                                                        <div className="flex items-center justify-between">
                                                            <Label htmlFor="leasing_bonus">Bonus / Komisi Leasing</Label>
                                                            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                                                                Pendapatan Showroom
                                                            </span>
                                                        </div>
                                                        <PriceInput
                                                            id="leasing_bonus"
                                                            name="leasing_bonus"
                                                            value={leasingBonus}
                                                            onValueChange={setLeasingBonus}
                                                            placeholder="0"
                                                            aria-invalid={Boolean(errors.leasing_bonus)}
                                                            className={`bg-background ${validationColorClassName}`}
                                                        />
                                                        <InputError message={errors.leasing_bonus} className={errorTextClassName} />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Visual Cashflow Breakdown Summary */}
                                            <div className="rounded-xl border border-blue-500/20 bg-background p-3.5 text-xs">
                                                <div className="font-semibold text-foreground mb-2 flex items-center gap-1.5">
                                                    <CoinsIcon className="size-4 text-blue-600" />
                                                    Arus Kas Masuk untuk Showroom:
                                                </div>
                                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                                                    <div className="rounded-lg bg-muted/50 p-2 text-center">
                                                        <div className="text-muted-foreground text-[11px]">1. Dari Customer (DP)</div>
                                                        <div className="font-bold text-emerald-600 mt-0.5">{currencyFormatter.format(numDownPayment)}</div>
                                                    </div>
                                                    <div className="rounded-lg bg-muted/50 p-2 text-center">
                                                        <div className="text-muted-foreground text-[11px]">2. Dari Leasing (Pokok)</div>
                                                        <div className="font-bold text-blue-600 mt-0.5">{currencyFormatter.format(numFinanceAmount)}</div>
                                                    </div>
                                                    <div className="rounded-lg bg-muted/50 p-2 text-center">
                                                        <div className="text-muted-foreground text-[11px]">3. Bonus Leasing Showroom</div>
                                                        <div className="font-bold text-indigo-600 mt-0.5">+{currencyFormatter.format(numLeasingBonus)}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Initial Payment Checkbox & Bank Info */}
                                    <div className="rounded-xl border p-4 space-y-4">
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="record_initial_payment"
                                                checked={recordInitialPayment}
                                                onCheckedChange={(checked) => setRecordInitialPayment(checked === true)}
                                                disabled={paymentType === 'cash_full'}
                                            />
                                            <Label htmlFor="record_initial_payment" className="text-sm font-medium cursor-pointer">
                                                {paymentType === 'cash_full'
                                                    ? 'Catat penerimaan pembayaran lunas langsung ke kasir/rekening'
                                                    : 'Catat penerimaan uang muka (DP) sekarang juga ke kasir/rekening'}
                                            </Label>
                                        </div>

                                        {recordInitialPayment && (
                                            <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2">
                                                {/* Tanggal Pembayaran */}
                                                <div className="grid gap-2 sm:col-span-2">
                                                    <div className="flex items-center justify-between">
                                                        <Label htmlFor="sale_payment_date">Tanggal Pembayaran / Uang Masuk</Label>
                                                        <button
                                                            type="button"
                                                            onClick={() => setPaymentDate(new Date().toISOString().split('T')[0])}
                                                            className="text-xs text-primary hover:underline font-medium"
                                                        >
                                                            Set Tanggal Hari Ini
                                                        </button>
                                                    </div>
                                                    <Input
                                                        id="sale_payment_date"
                                                        name="payment_date"
                                                        type="date"
                                                        value={paymentDate}
                                                        onChange={(e) => setPaymentDate(e.target.value)}
                                                        required
                                                        aria-invalid={Boolean(errors.payment_date)}
                                                        className={validationColorClassName}
                                                    />
                                                    <p className="text-[11px] text-muted-foreground">
                                                        Secara otomatis terisi tanggal hari ini. Ubah jika pembayaran diterima kemarin atau dijadwalkan besok.
                                                    </p>
                                                    <InputError message={errors.payment_date} className={errorTextClassName} />
                                                </div>

                                                <div className="grid gap-2">
                                                    <Label htmlFor="payment_method">Metode Pembayaran</Label>
                                                    <Select
                                                        value={paymentMethod}
                                                        onValueChange={(val) => setPaymentMethod(val as PaymentMethod)}
                                                    >
                                                        <SelectTrigger id="payment_method">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="transfer">Transfer Bank</SelectItem>
                                                            <SelectItem value="cash">Tunai (Kasir)</SelectItem>
                                                            <SelectItem value="qris">QRIS</SelectItem>
                                                            <SelectItem value="giro">Giro / Cek</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="grid gap-2">
                                                    <Label htmlFor="destination_account">Rekening Tujuan Showroom</Label>
                                                    <Input
                                                        id="destination_account"
                                                        name="destination_account"
                                                        value={destinationAccount}
                                                        onChange={(e) => setDestinationAccount(e.target.value)}
                                                        required
                                                    />
                                                </div>

                                                <div className="grid gap-2 sm:col-span-2">
                                                    <Label htmlFor="reference_number">No. Referensi / Berita Transfer (Opsional)</Label>
                                                    <Input
                                                        id="reference_number"
                                                        name="reference_number"
                                                        value={referenceNumber}
                                                        onChange={(e) => setReferenceNumber(e.target.value)}
                                                        placeholder="Contoh: TRX-12345"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Notes */}
                                    <div className="grid gap-2">
                                        <Label htmlFor="notes">Catatan Transaksi / Perjanjian Tambahan (Opsional)</Label>
                                        <Input
                                            id="notes"
                                            name="notes"
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            placeholder="Catatan garansi, bonus servis, janji serah terima dokumen, dll."
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right Column: Order Summary Card */}
                        <div className="space-y-6">
                            <Card className="shadow-xs sticky top-6">
                                <CardHeader>
                                    <CardTitle className="text-base">Ringkasan SPK Penjualan</CardTitle>
                                    <CardDescription>Kalkulasi finansial transaksi.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4 text-sm">
                                    <div className="divide-y space-y-3">
                                        <div className="flex justify-between items-center text-muted-foreground pt-1">
                                            <span>Unit Mobil:</span>
                                            <span className="font-semibold text-foreground">{selectedCar?.name ?? '—'}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-muted-foreground pt-3">
                                            <span>Harga Kesepakatan Deal:</span>
                                            <span className="font-bold text-foreground text-base">{currencyFormatter.format(numDealPrice)}</span>
                                        </div>

                                        {paymentType === 'cash_full' && (
                                            <div className="flex justify-between items-center text-emerald-600 font-semibold pt-3">
                                                <span>Bayar Lunas Hari Ini:</span>
                                                <span>{currencyFormatter.format(numDealPrice)}</span>
                                            </div>
                                        )}

                                        {paymentType === 'cash_tempo' && (
                                            <>
                                                <div className="flex justify-between items-center text-emerald-600 font-medium pt-3">
                                                    <span>Uang Muka (DP):</span>
                                                    <span>{currencyFormatter.format(numDownPayment)}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-amber-600 font-semibold pt-3">
                                                    <span>Sisa Pelunasan Tempo:</span>
                                                    <span>{currencyFormatter.format(numRemainingTempo)}</span>
                                                </div>
                                            </>
                                        )}

                                        {paymentType === 'credit' && (
                                            <>
                                                <div className="flex justify-between items-center text-emerald-600 font-medium pt-3">
                                                    <span>DP dari Customer:</span>
                                                    <span>{currencyFormatter.format(numDownPayment)}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-blue-600 font-semibold pt-3">
                                                    <span>Pokok Cair Leasing:</span>
                                                    <span>{currencyFormatter.format(numFinanceAmount)}</span>
                                                </div>
                                                {numLeasingBonus > 0 && (
                                                    <div className="flex justify-between items-center text-indigo-600 font-semibold pt-3">
                                                        <span>Bonus Leasing Showroom:</span>
                                                        <span>+{currencyFormatter.format(numLeasingBonus)}</span>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>

                                    <div className="pt-4 space-y-3">
                                        <Button
                                            type="submit"
                                            disabled={processing || availableCars.length === 0}
                                            className="w-full h-11 text-base bg-emerald-600 hover:bg-emerald-700 text-white"
                                        >
                                            {processing ? <Spinner /> : <FloppyDiskIcon className="size-5" />}
                                            Terbitkan SPK Penjualan
                                        </Button>

                                        <Button variant="outline" asChild className="w-full">
                                            <Link href={salesIndex.url()}>
                                                Batal & Kembali
                                            </Link>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </>
            )}
        </Form>
    );
}

import { Form } from '@inertiajs/react';
import { FloppyDiskIcon, MoneyIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import PaymentController from '@/actions/App/Http/Controllers/PaymentController';
import InputError from '@/components/input-error';
import { PriceInput } from '@/components/price-input';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
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
import type {
    PayerType,
    PaymentCategory,
    PaymentMethod,
    Sale,
} from '@/pages/sales/types';

type Props = {
    open: boolean;
    sale: Sale | null;
    onOpenChange: (open: boolean) => void;
    defaultCategory?: PaymentCategory;
};

const currencyFormatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
});

const validationColorClassName =
    'aria-invalid:border-red-500 aria-invalid:ring-red-500/20 dark:aria-invalid:ring-red-500/40';
const errorTextClassName = 'text-red-500 dark:text-red-500';

function PaymentDialogContent({
    sale,
    onOpenChange,
    defaultCategory,
}: {
    sale: Sale;
    onOpenChange: (open: boolean) => void;
    defaultCategory?: PaymentCategory;
}) {
    const isCredit = sale.payment_type === 'credit';
    const remainingBill =
        sale.remaining_bill ??
        Math.max(0, sale.deal_price - (sale.total_paid ?? 0));
    const bonusRemaining = Math.max(
        0,
        sale.leasing_bonus - (sale.total_bonus_paid ?? 0),
    );
    const hasDownPayment =
        sale.has_down_payment ??
        sale.payments?.some(
            (payment) => payment.payment_category === 'down_payment',
        ) ??
        false;

    const requiresDownPayment =
        sale.payment_type === 'cash_tempo' && !hasDownPayment;
    const suggestedCategory: PaymentCategory = requiresDownPayment
        ? 'down_payment'
        : isCredit
          ? remainingBill > 0
              ? 'finance_disbursement'
              : bonusRemaining > 0
                ? 'leasing_bonus'
                : 'settlement'
          : 'settlement';
    const initialCategory: PaymentCategory =
        (defaultCategory === 'down_payment' && hasDownPayment) ||
        (defaultCategory === 'installment' && requiresDownPayment)
            ? suggestedCategory
            : (defaultCategory ?? suggestedCategory);

    const [category, setCategory] = useState<PaymentCategory>(initialCategory);
    const [payerType, setPayerType] = useState<PayerType>(
        category === 'finance_disbursement' || category === 'leasing_bonus'
            ? 'finance'
            : 'customer',
    );

    const initialAmount =
        category === 'down_payment'
            ? Math.min(sale.down_payment, remainingBill)
            : category === 'leasing_bonus'
              ? bonusRemaining
              : remainingBill > 0
                ? remainingBill
                : 0;

    const [amount, setAmount] = useState<string>(
        initialAmount > 0 ? String(initialAmount) : '',
    );
    const [paymentDate, setPaymentDate] = useState<string>(
        new Date().toISOString().split('T')[0],
    );
    const [paymentMethod, setPaymentMethod] =
        useState<PaymentMethod>('transfer');
    const [destinationAccount, setDestinationAccount] = useState<string>(
        'BCA Showroom (0123-456-789)',
    );
    const [referenceNumber, setReferenceNumber] = useState<string>('');
    const [notes, setNotes] = useState<string>('');

    function handleCategoryChange(newCat: PaymentCategory) {
        setCategory(newCat);

        if (newCat === 'finance_disbursement' || newCat === 'leasing_bonus') {
            setPayerType('finance');

            if (newCat === 'leasing_bonus') {
                setAmount(
                    String(
                        bonusRemaining > 0
                            ? bonusRemaining
                            : sale.leasing_bonus,
                    ),
                );
            } else if (newCat === 'finance_disbursement') {
                setAmount(
                    String(
                        remainingBill > 0 ? remainingBill : sale.finance_amount,
                    ),
                );
            }
        } else {
            setPayerType('customer');

            if (newCat === 'down_payment') {
                const plannedDownPayment = Math.min(
                    sale.down_payment,
                    remainingBill,
                );

                setAmount(
                    plannedDownPayment > 0 ? String(plannedDownPayment) : '',
                );
            } else if (remainingBill > 0) {
                setAmount(String(remainingBill));
            }
        }
    }

    return (
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
                <div className="flex items-center gap-2">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-500">
                        <MoneyIcon className="size-5" weight="bold" />
                    </div>
                    <div>
                        <DialogTitle>Catat Pembayaran Masuk</DialogTitle>
                        <DialogDescription className="text-xs">
                            No. Invoice:{' '}
                            <span className="font-mono font-medium">
                                {sale.invoice_number}
                            </span>{' '}
                            ({sale.car?.name})
                        </DialogDescription>
                    </div>
                </div>
            </DialogHeader>

            <Form
                action={PaymentController.store.url(sale.id)}
                method="post"
                options={{ preserveScroll: true }}
                onSuccess={() => onOpenChange(false)}
                className="space-y-4 pt-1"
            >
                {({ processing, errors }) => (
                    <>
                        <input
                            type="hidden"
                            name="payer_type"
                            value={payerType}
                        />
                        <input
                            type="hidden"
                            name="payment_category"
                            value={category}
                        />
                        <input
                            type="hidden"
                            name="payment_method"
                            value={paymentMethod}
                        />

                        {/* Status Balance Reminder Box */}
                        <div className="space-y-1.5 rounded-lg border bg-muted/40 p-3 text-xs">
                            <div className="flex items-center justify-between text-muted-foreground">
                                <span>Harga Deal:</span>
                                <span className="font-medium text-foreground">
                                    {currencyFormatter.format(sale.deal_price)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-muted-foreground">
                                <span>Sudah Masuk:</span>
                                <span className="font-medium text-emerald-600">
                                    {currencyFormatter.format(
                                        sale.total_paid ?? 0,
                                    )}
                                </span>
                            </div>
                            <div className="flex items-center justify-between border-t pt-1 font-semibold">
                                <span>Sisa Piutang:</span>
                                <span
                                    className={
                                        remainingBill > 0
                                            ? 'text-amber-600 dark:text-amber-500'
                                            : 'text-emerald-600'
                                    }
                                >
                                    {currencyFormatter.format(remainingBill)}
                                </span>
                            </div>
                            {sale.leasing_bonus > 0 && (
                                <div className="flex items-center justify-between pt-0.5 text-xs text-muted-foreground">
                                    <span>Bonus Leasing:</span>
                                    <span>
                                        {currencyFormatter.format(
                                            sale.leasing_bonus,
                                        )}{' '}
                                        (Cair:{' '}
                                        {currencyFormatter.format(
                                            sale.total_bonus_paid ?? 0,
                                        )}
                                        )
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Form Inputs Grid */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            {/* Payment Category */}
                            <div className="grid gap-2 sm:col-span-2">
                                <Label htmlFor="payment_category">
                                    Kategori Pembayaran
                                </Label>
                                <Select
                                    value={category}
                                    onValueChange={(val) =>
                                        handleCategoryChange(
                                            val as PaymentCategory,
                                        )
                                    }
                                >
                                    <SelectTrigger
                                        id="payment_category"
                                        className={
                                            errors.payment_category
                                                ? validationColorClassName
                                                : ''
                                        }
                                    >
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {!hasDownPayment && (
                                            <SelectItem value="down_payment">
                                                Uang Muka (DP / Booking)
                                            </SelectItem>
                                        )}
                                        {!requiresDownPayment && (
                                            <SelectItem value="installment">
                                                Angsuran / Cicilan Bertahap
                                            </SelectItem>
                                        )}
                                        <SelectItem value="settlement">
                                            Pelunasan Customer
                                        </SelectItem>
                                        {isCredit && (
                                            <>
                                                <SelectItem value="finance_disbursement">
                                                    Pencairan Pokok Leasing
                                                </SelectItem>
                                                <SelectItem value="leasing_bonus">
                                                    Pencairan Bonus/Komisi
                                                    Leasing
                                                </SelectItem>
                                            </>
                                        )}
                                        <SelectItem value="other">
                                            Lainnya
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                {hasDownPayment && (
                                    <p className="text-xs text-muted-foreground">
                                        DP / booking sudah pernah dicatat dan
                                        tidak dapat ditambahkan kembali.
                                    </p>
                                )}
                                {requiresDownPayment && (
                                    <p className="text-xs text-muted-foreground">
                                        Catat DP / booking terlebih dahulu agar
                                        kategori angsuran tersedia.
                                    </p>
                                )}
                                <InputError
                                    message={errors.payment_category}
                                    className={errorTextClassName}
                                />
                            </div>

                            {/* Amount */}
                            <div className="grid gap-2 sm:col-span-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="amount">
                                        Nominal Uang Masuk
                                    </Label>
                                    {remainingBill > 0 &&
                                        category !== 'leasing_bonus' && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setAmount(
                                                        String(remainingBill),
                                                    )
                                                }
                                                className="text-xs font-medium text-primary hover:underline"
                                            >
                                                Bayar Lunas Sisa (
                                                {currencyFormatter.format(
                                                    remainingBill,
                                                )}
                                                )
                                            </button>
                                        )}
                                </div>
                                <PriceInput
                                    id="amount"
                                    name="amount"
                                    value={amount}
                                    onValueChange={setAmount}
                                    placeholder="0"
                                    required
                                    aria-invalid={Boolean(errors.amount)}
                                    className={validationColorClassName}
                                />
                                <InputError
                                    message={errors.amount}
                                    className={errorTextClassName}
                                />
                            </div>

                            {/* Payment Date */}
                            <div className="grid gap-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="payment_date">
                                        Tanggal Terima Uang
                                    </Label>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setPaymentDate(
                                                new Date()
                                                    .toISOString()
                                                    .split('T')[0],
                                            )
                                        }
                                        className="text-xs font-medium text-primary hover:underline"
                                    >
                                        Hari Ini
                                    </button>
                                </div>
                                <Input
                                    id="payment_date"
                                    name="payment_date"
                                    type="date"
                                    value={paymentDate}
                                    onChange={(e) =>
                                        setPaymentDate(e.target.value)
                                    }
                                    required
                                    aria-invalid={Boolean(errors.payment_date)}
                                    className={validationColorClassName}
                                />
                                <InputError
                                    message={errors.payment_date}
                                    className={errorTextClassName}
                                />
                            </div>

                            {/* Payment Method */}
                            <div className="grid gap-2">
                                <Label htmlFor="payment_method">
                                    Metode Pembayaran
                                </Label>
                                <Select
                                    value={paymentMethod}
                                    onValueChange={(val) =>
                                        setPaymentMethod(val as PaymentMethod)
                                    }
                                >
                                    <SelectTrigger id="payment_method">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="transfer">
                                            Transfer Bank
                                        </SelectItem>
                                        <SelectItem value="cash">
                                            Tunai (Kasir)
                                        </SelectItem>
                                        <SelectItem value="qris">
                                            QRIS
                                        </SelectItem>
                                        <SelectItem value="giro">
                                            Cek / Bilyet Giro
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError
                                    message={errors.payment_method}
                                    className={errorTextClassName}
                                />
                            </div>

                            {/* Destination Account */}
                            <div className="grid gap-2 sm:col-span-2">
                                <Label htmlFor="destination_account">
                                    Rekening / Kas Tujuan Penerima
                                </Label>
                                <Input
                                    id="destination_account"
                                    name="destination_account"
                                    value={destinationAccount}
                                    onChange={(e) =>
                                        setDestinationAccount(e.target.value)
                                    }
                                    placeholder="Contoh: BCA Showroom (0123-456-789)"
                                    required
                                    aria-invalid={Boolean(
                                        errors.destination_account,
                                    )}
                                    className={validationColorClassName}
                                />
                                <InputError
                                    message={errors.destination_account}
                                    className={errorTextClassName}
                                />
                            </div>

                            {/* Reference Number */}
                            <div className="grid gap-2 sm:col-span-2">
                                <Label htmlFor="reference_number">
                                    No. Referensi / Berita Transfer (Opsional)
                                </Label>
                                <Input
                                    id="reference_number"
                                    name="reference_number"
                                    value={referenceNumber}
                                    onChange={(e) =>
                                        setReferenceNumber(e.target.value)
                                    }
                                    placeholder="Contoh: TRX-92810 atau Nama Pengirim Rekening"
                                    aria-invalid={Boolean(
                                        errors.reference_number,
                                    )}
                                    className={validationColorClassName}
                                />
                                <InputError
                                    message={errors.reference_number}
                                    className={errorTextClassName}
                                />
                            </div>

                            {/* Notes */}
                            <div className="grid gap-2 sm:col-span-2">
                                <Label htmlFor="payment_notes">
                                    Catatan Pembayaran (Opsional)
                                </Label>
                                <Input
                                    id="payment_notes"
                                    name="notes"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Catatan pelunasan, nama transfer, dsb."
                                    aria-invalid={Boolean(errors.notes)}
                                    className={validationColorClassName}
                                />
                                <InputError
                                    message={errors.notes}
                                    className={errorTextClassName}
                                />
                            </div>
                        </div>

                        <DialogFooter className="pt-3">
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
                                disabled={processing}
                                className="bg-emerald-600 text-white hover:bg-emerald-700"
                            >
                                {processing ? <Spinner /> : <FloppyDiskIcon />}
                                Simpan Pembayaran
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </Form>
        </DialogContent>
    );
}

export function PaymentDialog({
    open,
    sale,
    onOpenChange,
    defaultCategory,
}: Props) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {sale && open && (
                <PaymentDialogContent
                    sale={sale}
                    onOpenChange={onOpenChange}
                    defaultCategory={defaultCategory}
                />
            )}
        </Dialog>
    );
}

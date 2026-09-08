import { Form, Link } from '@inertiajs/react';
import {
    ArrowsLeftRightIcon,
    BankIcon,
    CalendarBlankIcon,
    CarProfileIcon,
    CheckCircleIcon,
    CoinsIcon,
    CreditCardIcon,
    CurrencyCircleDollarIcon,
    FloppyDiskIcon,
    MagnifyingGlassIcon,
    MoneyIcon,
    XIcon,
} from '@phosphor-icons/react';
import { useMemo, useState } from 'react';
import SaleController from '@/actions/App/Http/Controllers/SaleController';
import { CardSectionHeader } from '@/components/card-section-header';
import InputError from '@/components/input-error';
import { PriceInput } from '@/components/price-input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { useSaleCalculations } from '@/hooks/use-sale-calculations';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import type { Brand } from '@/pages/brands/types';
import type { Car } from '@/pages/cars/types';
import type { Customer } from '@/pages/customers/types';
import type {
    FinanceCompany,
    PaymentMethod,
    PaymentType,
} from '@/pages/sales/types';
import { index as salesIndex } from '@/routes/sales';
import { SaleTradeInSection } from './components/sale-trade-in-section';

type Props = {
    availableCars: Car[];
    customers: Pick<Customer, 'id' | 'name' | 'phone' | 'ktp_number'>[];
    financeCompanies: FinanceCompany[];
    brands?: Pick<Brand, 'id' | 'name'>[];
};

const validationColorClassName =
    'aria-invalid:border-red-500 aria-invalid:ring-red-500/20 dark:aria-invalid:ring-red-500/40';
const errorTextClassName = 'text-red-500 dark:text-red-500';
const formReferenceDate = new Date();
const defaultPaymentDate = formReferenceDate.toISOString().split('T')[0];
const defaultDisbursementDate = new Date(
    formReferenceDate.getTime() + 5 * 24 * 60 * 60 * 1000,
)
    .toISOString()
    .split('T')[0];
const defaultDueDate = new Date(
    formReferenceDate.getTime() + 14 * 24 * 60 * 60 * 1000,
)
    .toISOString()
    .split('T')[0];

function carLabel(car: Car): string {
    return [
        car.brand?.name,
        car.name,
        car.license_plate ? `(${car.license_plate})` : '(Tanpa plat)',
        `• ${car.year}`,
        `• ${formatCurrency(car.selling_price)}`,
    ]
        .filter(Boolean)
        .join(' ');
}

function carSearchText(car: Car): string {
    return [
        car.brand?.name,
        car.name,
        car.license_plate,
        car.color,
        String(car.year),
    ]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase('id-ID');
}

function customerLabel(
    customer: Pick<Customer, 'id' | 'name' | 'phone' | 'ktp_number'>,
): string {
    return [
        customer.name,
        customer.phone ? `(${customer.phone})` : '',
        customer.ktp_number ? `• NIK: ${customer.ktp_number}` : '',
    ]
        .filter(Boolean)
        .join(' ');
}

function customerSearchText(
    customer: Pick<Customer, 'id' | 'name' | 'phone' | 'ktp_number'>,
): string {
    return [customer.name, customer.phone, customer.ktp_number]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase('id-ID');
}

export function SaleForm({
    availableCars,
    customers,
    financeCompanies,
    brands = [],
}: Props) {
    const initialCar = availableCars[0] ?? null;
    const initialCustomer = customers[0] ?? null;

    const [selectedCarId, setSelectedCarId] = useState<string>(
        initialCar?.id ? String(initialCar.id) : '',
    );
    const [carSearch, setCarSearch] = useState<string>(
        initialCar ? carLabel(initialCar) : '',
    );
    const [isCarListOpen, setIsCarListOpen] = useState(false);

    const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
        initialCustomer?.id ? String(initialCustomer.id) : '',
    );
    const [customerSearch, setCustomerSearch] = useState<string>(
        initialCustomer ? customerLabel(initialCustomer) : '',
    );
    const [isCustomerListOpen, setIsCustomerListOpen] = useState(false);

    const [paymentType, setPaymentType] = useState<PaymentType>('cash_full');

    const selectedCar = availableCars.find(
        (c) => String(c.id) === selectedCarId,
    );
    const selectedCustomer = customers.find(
        (c) => String(c.id) === selectedCustomerId,
    );

    const normalizedCarSearch = carSearch.trim().toLocaleLowerCase('id-ID');
    const matchingCars = useMemo(
        () =>
            normalizedCarSearch === ''
                ? availableCars
                : availableCars.filter((car) =>
                      carSearchText(car).includes(normalizedCarSearch),
                  ),
        [availableCars, normalizedCarSearch],
    );
    const visibleCars = matchingCars.slice(0, 10);

    const normalizedCustomerSearch = customerSearch
        .trim()
        .toLocaleLowerCase('id-ID');
    const matchingCustomers = useMemo(
        () =>
            normalizedCustomerSearch === ''
                ? customers
                : customers.filter((customer) =>
                      customerSearchText(customer).includes(
                          normalizedCustomerSearch,
                      ),
                  ),
        [customers, normalizedCustomerSearch],
    );
    const visibleCustomers = matchingCustomers.slice(0, 10);

    const [dealPrice, setDealPrice] = useState<string>(
        selectedCar?.selling_price ? String(selectedCar.selling_price) : '',
    );
    const [downPayment, setDownPayment] = useState<string>('');
    const [financeCompanyId, setFinanceCompanyId] = useState<string>(
        financeCompanies[0]?.id ? String(financeCompanies[0].id) : '',
    );
    const [disbursementEstDate, setDisbursementEstDate] = useState<string>(
        defaultDisbursementDate,
    );
    const [leasingBonus, setLeasingBonus] = useState<string>('3000000');
    const [dueDate, setDueDate] = useState<string>(defaultDueDate);
    const [tradeInLicensePlate, setTradeInLicensePlate] = useState<string>('');
    const [tradeInBrand, setTradeInBrand] = useState<string>('');
    const [tradeInCarName, setTradeInCarName] = useState<string>('');
    const [tradeInYear, setTradeInYear] = useState<string>(
        String(new Date().getFullYear() - 3),
    );
    const [tradeInColor, setTradeInColor] = useState<string>('');
    const [tradeInMileage, setTradeInMileage] = useState<string>('');
    const [tradeInPrice, setTradeInPrice] = useState<string>('');
    const [tradeInNotes, setTradeInNotes] = useState<string>('');
    const [recordInitialPayment, setRecordInitialPayment] = useState(true);
    const [paymentDate, setPaymentDate] = useState<string>(defaultPaymentDate);
    const [paymentMethod, setPaymentMethod] =
        useState<PaymentMethod>('transfer');
    const [destinationAccount, setDestinationAccount] = useState<string>(
        'BCA Showroom (0123-456-789)',
    );
    const [referenceNumber, setReferenceNumber] = useState<string>('');
    const [notes, setNotes] = useState<string>('');

    function selectCar(car: Car) {
        const strId = String(car.id);
        setSelectedCarId(strId);
        setCarSearch(carLabel(car));
        setIsCarListOpen(false);

        if (car.selling_price) {
            setDealPrice(String(car.selling_price));

            if (paymentType === 'cash_tempo' || paymentType === 'credit') {
                const defaultDp = Math.round(car.selling_price * 0.2);
                setDownPayment(String(defaultDp));
            } else if (paymentType === 'cash_full') {
                setDownPayment(String(car.selling_price));
            }
        }
    }

    function clearCar() {
        setSelectedCarId('');
        setCarSearch('');
        setIsCarListOpen(true);
    }

    function selectCustomer(
        customer: Pick<Customer, 'id' | 'name' | 'phone' | 'ktp_number'>,
    ) {
        setSelectedCustomerId(String(customer.id));
        setCustomerSearch(customerLabel(customer));
        setIsCustomerListOpen(false);
    }

    function clearCustomer() {
        setSelectedCustomerId('');
        setCustomerSearch('');
        setIsCustomerListOpen(true);
    }

    function handlePaymentTypeChange(type: PaymentType) {
        setPaymentType(type);

        const numDeal = Number(dealPrice) || 0;

        if (type === 'cash_full') {
            setDownPayment(String(numDeal));
        } else if (type === 'cash_tempo' || type === 'credit') {
            const defaultDp = Math.round(numDeal * 0.2);
            setDownPayment(String(defaultDp));
        } else if (type === 'trade_in') {
            setDownPayment('');
            setTradeInPrice('');
        }
    }

    const totalCapital = selectedCar?.capital?.total_capital ?? 0;
    const {
        numDealPrice,
        numDownPayment,
        numFinanceAmount,
        numTradeInPrice,
        numLeasingBonus,
        estimatedProfit,
        numRemainingTempo,
        numRemainingTradeIn,
    } = useSaleCalculations({
        dealPrice,
        downPayment,
        tradeInPrice,
        leasingBonus,
        totalCapital,
    });
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
                    <input
                        type="hidden"
                        name="customer_id"
                        value={selectedCustomerId}
                    />
                    <input
                        type="hidden"
                        name="payment_type"
                        value={paymentType}
                    />
                    <input
                        type="hidden"
                        name="record_initial_payment"
                        value={recordInitialPayment ? '1' : '0'}
                    />
                    <input
                        type="hidden"
                        name="payment_method"
                        value={paymentMethod}
                    />
                    {paymentType === 'credit' && (
                        <>
                            <input
                                type="hidden"
                                name="finance_company_id"
                                value={financeCompanyId}
                            />
                            <input
                                type="hidden"
                                name="finance_amount"
                                value={String(numFinanceAmount)}
                            />
                        </>
                    )}

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        {/* Left 2 Columns: Main Input Form */}
                        <div className="space-y-6 lg:col-span-2">
                            {/* Section 1: Unit & Customer */}
                            <Card className="shadow-xs">
                                <CardSectionHeader
                                    icon={
                                        <CarProfileIcon
                                            className="size-4"
                                            weight="bold"
                                        />
                                    }
                                    title="Unit Mobil & Pembeli"
                                    description="Pilih unit mobil yang dijual dan data customer pembeli."
                                />
                                <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    {/* Search & Select Car */}
                                    <div className="grid gap-2 sm:col-span-2">
                                        <Label htmlFor="sale-car-search">
                                            Pilih Unit Mobil Tersedia{' '}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </Label>
                                        {availableCars.length > 0 ? (
                                            <div
                                                className="relative"
                                                onBlur={(event) => {
                                                    const nextTarget =
                                                        event.relatedTarget as Node | null;

                                                    if (
                                                        !nextTarget ||
                                                        !event.currentTarget.contains(
                                                            nextTarget,
                                                        )
                                                    ) {
                                                        setIsCarListOpen(false);
                                                    }
                                                }}
                                            >
                                                <div className="relative">
                                                    <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                                    <Input
                                                        id="sale-car-search"
                                                        type="search"
                                                        value={carSearch}
                                                        onFocus={() =>
                                                            setIsCarListOpen(
                                                                true,
                                                            )
                                                        }
                                                        onChange={(event) => {
                                                            const value =
                                                                event.target
                                                                    .value;

                                                            setCarSearch(value);
                                                            setIsCarListOpen(
                                                                true,
                                                            );

                                                            if (
                                                                selectedCar &&
                                                                value !==
                                                                    carLabel(
                                                                        selectedCar,
                                                                    )
                                                            ) {
                                                                setSelectedCarId(
                                                                    '',
                                                                );
                                                            }
                                                        }}
                                                        placeholder="Cari nama mobil, merek, atau plat nomor..."
                                                        autoComplete="off"
                                                        aria-expanded={
                                                            isCarListOpen
                                                        }
                                                        aria-controls="sale-car-search-results"
                                                        aria-invalid={Boolean(
                                                            errors.car_id,
                                                        )}
                                                        className={`pr-10 pl-9 ${validationColorClassName}`}
                                                    />
                                                    {carSearch !== '' && (
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={clearCar}
                                                            aria-label="Hapus pilihan mobil"
                                                            className="absolute top-1/2 right-1 size-8 -translate-y-1/2"
                                                        >
                                                            <XIcon />
                                                        </Button>
                                                    )}
                                                </div>

                                                {isCarListOpen && (
                                                    <div
                                                        id="sale-car-search-results"
                                                        role="listbox"
                                                        className="absolute z-50 mt-1 max-h-72 w-full overflow-y-auto rounded-lg border bg-popover p-1 text-popover-foreground shadow-md"
                                                    >
                                                        {visibleCars.length ===
                                                        0 ? (
                                                            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                                                                Mobil tidak
                                                                ditemukan.
                                                            </p>
                                                        ) : (
                                                            visibleCars.map(
                                                                (car) => {
                                                                    const isSelected =
                                                                        selectedCarId ===
                                                                        String(
                                                                            car.id,
                                                                        );

                                                                    return (
                                                                        <button
                                                                            key={
                                                                                car.id
                                                                            }
                                                                            type="button"
                                                                            role="option"
                                                                            aria-selected={
                                                                                isSelected
                                                                            }
                                                                            onClick={() =>
                                                                                selectCar(
                                                                                    car,
                                                                                )
                                                                            }
                                                                            className={cn(
                                                                                'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none',
                                                                                isSelected &&
                                                                                    'bg-primary/10',
                                                                            )}
                                                                        >
                                                                            <div className="min-w-0 flex-1">
                                                                                <p className="font-semibold text-foreground">
                                                                                    {
                                                                                        car
                                                                                            .brand
                                                                                            ?.name
                                                                                    }{' '}
                                                                                    {
                                                                                        car.name
                                                                                    }
                                                                                </p>
                                                                                <p className="text-xs text-muted-foreground">
                                                                                    {car.license_plate ??
                                                                                        'Tanpa plat'}{' '}
                                                                                    ·
                                                                                    Tahun{' '}
                                                                                    {
                                                                                        car.year
                                                                                    }{' '}
                                                                                    {car.color
                                                                                        ? `· ${car.color}`
                                                                                        : ''}
                                                                                </p>
                                                                            </div>
                                                                            <div className="text-right">
                                                                                <span className="font-semibold text-emerald-600">
                                                                                    {formatCurrency(
                                                                                        car.selling_price,
                                                                                    )}
                                                                                </span>
                                                                            </div>
                                                                            {isSelected && (
                                                                                <CheckCircleIcon
                                                                                    weight="fill"
                                                                                    className="size-5 shrink-0 text-primary"
                                                                                />
                                                                            )}
                                                                        </button>
                                                                    );
                                                                },
                                                            )
                                                        )}

                                                        {matchingCars.length >
                                                            10 && (
                                                            <p className="border-t px-3 py-2 text-xs text-muted-foreground">
                                                                Menampilkan 10
                                                                dari{' '}
                                                                {
                                                                    matchingCars.length
                                                                }{' '}
                                                                mobil yang
                                                                cocok. Ketik
                                                                lebih spesifik
                                                                untuk
                                                                mempersempit.
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                                                Tidak ada mobil berstatus
                                                tersedia. Silakan tambah unit
                                                mobil baru terlebih dahulu.
                                            </div>
                                        )}
                                        <InputError
                                            message={errors.car_id}
                                            className={errorTextClassName}
                                        />
                                    </div>

                                    {/* Search & Select Customer */}
                                    <div className="grid gap-2 sm:col-span-2">
                                        <Label htmlFor="sale-customer-search">
                                            Pilih Customer Pembeli{' '}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </Label>
                                        {customers.length > 0 ? (
                                            <div
                                                className="relative"
                                                onBlur={(event) => {
                                                    const nextTarget =
                                                        event.relatedTarget as Node | null;

                                                    if (
                                                        !nextTarget ||
                                                        !event.currentTarget.contains(
                                                            nextTarget,
                                                        )
                                                    ) {
                                                        setIsCustomerListOpen(
                                                            false,
                                                        );
                                                    }
                                                }}
                                            >
                                                <div className="relative">
                                                    <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                                    <Input
                                                        id="sale-customer-search"
                                                        type="search"
                                                        value={customerSearch}
                                                        onFocus={() =>
                                                            setIsCustomerListOpen(
                                                                true,
                                                            )
                                                        }
                                                        onChange={(event) => {
                                                            const value =
                                                                event.target
                                                                    .value;

                                                            setCustomerSearch(
                                                                value,
                                                            );
                                                            setIsCustomerListOpen(
                                                                true,
                                                            );

                                                            if (
                                                                selectedCustomer &&
                                                                value !==
                                                                    customerLabel(
                                                                        selectedCustomer,
                                                                    )
                                                            ) {
                                                                setSelectedCustomerId(
                                                                    '',
                                                                );
                                                            }
                                                        }}
                                                        placeholder="Cari nama pembeli, nomor telepon, atau NIK KTP..."
                                                        autoComplete="off"
                                                        aria-expanded={
                                                            isCustomerListOpen
                                                        }
                                                        aria-controls="sale-customer-search-results"
                                                        aria-invalid={Boolean(
                                                            errors.customer_id,
                                                        )}
                                                        className={`pr-10 pl-9 ${validationColorClassName}`}
                                                    />
                                                    {customerSearch !== '' && (
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={
                                                                clearCustomer
                                                            }
                                                            aria-label="Hapus pilihan customer"
                                                            className="absolute top-1/2 right-1 size-8 -translate-y-1/2"
                                                        >
                                                            <XIcon />
                                                        </Button>
                                                    )}
                                                </div>

                                                {isCustomerListOpen && (
                                                    <div
                                                        id="sale-customer-search-results"
                                                        role="listbox"
                                                        className="absolute z-50 mt-1 max-h-72 w-full overflow-y-auto rounded-lg border bg-popover p-1 text-popover-foreground shadow-md"
                                                    >
                                                        {visibleCustomers.length ===
                                                        0 ? (
                                                            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                                                                Customer tidak
                                                                ditemukan.
                                                            </p>
                                                        ) : (
                                                            visibleCustomers.map(
                                                                (customer) => {
                                                                    const isSelected =
                                                                        selectedCustomerId ===
                                                                        String(
                                                                            customer.id,
                                                                        );

                                                                    return (
                                                                        <button
                                                                            key={
                                                                                customer.id
                                                                            }
                                                                            type="button"
                                                                            role="option"
                                                                            aria-selected={
                                                                                isSelected
                                                                            }
                                                                            onClick={() =>
                                                                                selectCustomer(
                                                                                    customer,
                                                                                )
                                                                            }
                                                                            className={cn(
                                                                                'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none',
                                                                                isSelected &&
                                                                                    'bg-primary/10',
                                                                            )}
                                                                        >
                                                                            <div className="min-w-0 flex-1">
                                                                                <p className="font-semibold text-foreground">
                                                                                    {
                                                                                        customer.name
                                                                                    }
                                                                                </p>
                                                                                <p className="text-xs text-muted-foreground">
                                                                                    {customer.phone
                                                                                        ? customer.phone
                                                                                        : 'Tanpa nomor telepon'}{' '}
                                                                                    {customer.ktp_number
                                                                                        ? `· NIK: ${customer.ktp_number}`
                                                                                        : ''}
                                                                                </p>
                                                                            </div>
                                                                            {isSelected && (
                                                                                <CheckCircleIcon
                                                                                    weight="fill"
                                                                                    className="size-5 shrink-0 text-primary"
                                                                                />
                                                                            )}
                                                                        </button>
                                                                    );
                                                                },
                                                            )
                                                        )}

                                                        {matchingCustomers.length >
                                                            10 && (
                                                            <p className="border-t px-3 py-2 text-xs text-muted-foreground">
                                                                Menampilkan 10
                                                                dari{' '}
                                                                {
                                                                    matchingCustomers.length
                                                                }{' '}
                                                                customer yang
                                                                cocok. Ketik
                                                                lebih spesifik
                                                                untuk
                                                                mempersempit.
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                                                Tidak ada data customer. Silakan
                                                tambah customer baru terlebih
                                                dahulu.
                                            </div>
                                        )}
                                        <InputError
                                            message={errors.customer_id}
                                            className={errorTextClassName}
                                        />
                                    </div>

                                    {/* Deal Price */}
                                    <div className="grid gap-2 sm:col-span-2">
                                        <Label htmlFor="deal_price">
                                            Harga Kesepakatan Deal{' '}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </Label>
                                        <PriceInput
                                            id="deal_price"
                                            name="deal_price"
                                            value={dealPrice}
                                            onValueChange={setDealPrice}
                                            placeholder="0"
                                            required
                                            aria-invalid={Boolean(
                                                errors.deal_price,
                                            )}
                                            className={validationColorClassName}
                                        />
                                        <InputError
                                            message={errors.deal_price}
                                            className={errorTextClassName}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Section 2: Payment Scheme */}
                            <Card className="shadow-xs">
                                <CardSectionHeader
                                    icon={
                                        <CurrencyCircleDollarIcon
                                            className="size-4"
                                            weight="bold"
                                        />
                                    }
                                    iconClassName="bg-emerald-500/10 text-emerald-600 dark:text-emerald-500"
                                    title="Skema Pembayaran"
                                    description="Tentukan metode pembayaran: Tunai Lunas, Tunai Tempo, atau Kredit Leasing."
                                />
                                <CardContent className="space-y-6">
                                    {/* Payment Type Selection Buttons */}
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handlePaymentTypeChange(
                                                    'cash_full',
                                                )
                                            }
                                            className={`flex flex-col items-start gap-1 rounded-xl border p-4 text-left transition-all ${
                                                paymentType === 'cash_full'
                                                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20 dark:bg-primary/10'
                                                    : 'hover:bg-muted/50'
                                            }`}
                                        >
                                            <div className="flex items-center gap-1.5 text-sm font-semibold">
                                                <MoneyIcon className="size-4 text-emerald-600" />
                                                Tunai Lunas
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                Pembayaran penuh 100% lunas saat
                                                transaksi.
                                            </div>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                handlePaymentTypeChange(
                                                    'cash_tempo',
                                                )
                                            }
                                            className={`flex flex-col items-start gap-1 rounded-xl border p-4 text-left transition-all ${
                                                paymentType === 'cash_tempo'
                                                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20 dark:bg-primary/10'
                                                    : 'hover:bg-muted/50'
                                            }`}
                                        >
                                            <div className="flex items-center gap-1.5 text-sm font-semibold">
                                                <CalendarBlankIcon className="size-4 text-amber-600" />
                                                Tunai Tempo
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                DP / Booking fee + Jatuh tempo
                                                pelunasan.
                                            </div>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                handlePaymentTypeChange(
                                                    'credit',
                                                )
                                            }
                                            className={`flex flex-col items-start gap-1 rounded-xl border p-4 text-left transition-all ${
                                                paymentType === 'credit'
                                                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20 dark:bg-primary/10'
                                                    : 'hover:bg-muted/50'
                                            }`}
                                        >
                                            <div className="flex items-center gap-1.5 text-sm font-semibold">
                                                <CreditCardIcon className="size-4 text-blue-600" />
                                                Kredit Leasing
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                DP Customer + Pencairan Pokok &
                                                Bonus Finance.
                                            </div>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                handlePaymentTypeChange(
                                                    'trade_in',
                                                )
                                            }
                                            className={`flex flex-col items-start gap-1 rounded-xl border p-4 text-left transition-all ${
                                                paymentType === 'trade_in'
                                                    ? 'border-purple-600 bg-purple-500/5 ring-2 ring-purple-500/20 dark:bg-purple-500/10'
                                                    : 'hover:bg-muted/50'
                                            }`}
                                        >
                                            <div className="flex items-center gap-1.5 text-sm font-semibold">
                                                <ArrowsLeftRightIcon className="size-4 text-purple-600 dark:text-purple-400" />
                                                Tukar Tambah
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                Tukar unit mobil customer +
                                                selisih pembayaran.
                                            </div>
                                        </button>
                                    </div>

                                    {/* Dynamic Fields for Trade In */}
                                    {paymentType === 'trade_in' && (
                                        <SaleTradeInSection
                                            tradeInBrand={tradeInBrand}
                                            setTradeInBrand={setTradeInBrand}
                                            tradeInCarName={tradeInCarName}
                                            setTradeInCarName={
                                                setTradeInCarName
                                            }
                                            tradeInLicensePlate={
                                                tradeInLicensePlate
                                            }
                                            setTradeInLicensePlate={
                                                setTradeInLicensePlate
                                            }
                                            tradeInYear={tradeInYear}
                                            setTradeInYear={setTradeInYear}
                                            tradeInColor={tradeInColor}
                                            setTradeInColor={setTradeInColor}
                                            tradeInMileage={tradeInMileage}
                                            setTradeInMileage={
                                                setTradeInMileage
                                            }
                                            tradeInPrice={tradeInPrice}
                                            setTradeInPrice={setTradeInPrice}
                                            downPayment={downPayment}
                                            setDownPayment={setDownPayment}
                                            tradeInNotes={tradeInNotes}
                                            setTradeInNotes={setTradeInNotes}
                                            errors={errors}
                                            brands={brands}
                                            validationColorClassName={
                                                validationColorClassName
                                            }
                                            errorTextClassName={
                                                errorTextClassName
                                            }
                                        />
                                    )}

                                    {/* Dynamic Fields for Cash Tempo */}
                                    {paymentType === 'cash_tempo' && (
                                        <div className="grid grid-cols-1 gap-4 rounded-xl border bg-amber-500/5 p-4 sm:grid-cols-2 dark:bg-amber-500/10">
                                            <div className="grid gap-2">
                                                <Label htmlFor="down_payment">
                                                    Uang Muka / Booking Fee (DP)
                                                </Label>
                                                <PriceInput
                                                    id="down_payment"
                                                    name="down_payment"
                                                    value={downPayment}
                                                    onValueChange={
                                                        setDownPayment
                                                    }
                                                    placeholder="0"
                                                    required
                                                    aria-invalid={Boolean(
                                                        errors.down_payment,
                                                    )}
                                                    className={
                                                        validationColorClassName
                                                    }
                                                />
                                                <InputError
                                                    message={
                                                        errors.down_payment
                                                    }
                                                    className={
                                                        errorTextClassName
                                                    }
                                                />
                                            </div>

                                            <div className="grid gap-2">
                                                <Label htmlFor="due_date">
                                                    Tanggal Jatuh Tempo
                                                    Pelunasan
                                                </Label>
                                                <Input
                                                    id="due_date"
                                                    name="due_date"
                                                    type="date"
                                                    value={dueDate}
                                                    onChange={(e) =>
                                                        setDueDate(
                                                            e.target.value,
                                                        )
                                                    }
                                                    required
                                                    aria-invalid={Boolean(
                                                        errors.due_date,
                                                    )}
                                                    className={
                                                        validationColorClassName
                                                    }
                                                />
                                                <InputError
                                                    message={errors.due_date}
                                                    className={
                                                        errorTextClassName
                                                    }
                                                />
                                            </div>

                                            <div className="text-xs font-medium text-amber-700 sm:col-span-2 dark:text-amber-400">
                                                Sisa piutang yang harus dilunasi
                                                customer:{' '}
                                                <strong>
                                                    {formatCurrency(
                                                        numRemainingTempo,
                                                    )}
                                                </strong>
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
                                                        <BankIcon
                                                            className="size-4"
                                                            weight="bold"
                                                        />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-semibold text-foreground">
                                                            Detail Pembiayaan
                                                            Kredit (Leasing)
                                                        </h4>
                                                        <p className="text-xs text-muted-foreground">
                                                            Pengaturan lembaga
                                                            finance, porsi DP
                                                            customer, dan
                                                            estimasi pencairan.
                                                        </p>
                                                    </div>
                                                </div>
                                                {selectedFinanceCompany && (
                                                    <Badge
                                                        variant="secondary"
                                                        className="bg-blue-500/10 font-mono text-xs text-blue-700 dark:text-blue-400"
                                                    >
                                                        {selectedFinanceCompany.code ??
                                                            selectedFinanceCompany.name}
                                                    </Badge>
                                                )}
                                            </div>

                                            {/* 1. Pilih Lembaga Finance */}
                                            <div className="space-y-2">
                                                <Label
                                                    htmlFor="finance_company_id"
                                                    className="text-xs font-semibold tracking-wider text-muted-foreground uppercase"
                                                >
                                                    1. Mitra Lembaga Pembiayaan{' '}
                                                    <span className="text-red-500">
                                                        *
                                                    </span>
                                                </Label>
                                                <Select
                                                    value={financeCompanyId}
                                                    onValueChange={
                                                        setFinanceCompanyId
                                                    }
                                                >
                                                    <SelectTrigger
                                                        id="finance_company_id"
                                                        aria-invalid={Boolean(
                                                            errors.finance_company_id,
                                                        )}
                                                        className="bg-background"
                                                    >
                                                        <SelectValue placeholder="Pilih leasing..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {financeCompanies.map(
                                                            (fc) => (
                                                                <SelectItem
                                                                    key={fc.id}
                                                                    value={String(
                                                                        fc.id,
                                                                    )}
                                                                >
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="font-medium">
                                                                            {
                                                                                fc.name
                                                                            }
                                                                        </span>
                                                                        {fc.pic_name && (
                                                                            <span className="text-xs text-muted-foreground">
                                                                                •
                                                                                PIC:{' '}
                                                                                {
                                                                                    fc.pic_name
                                                                                }{' '}
                                                                                (
                                                                                {fc.pic_phone ??
                                                                                    '—'}

                                                                                )
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </SelectItem>
                                                            ),
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                                <InputError
                                                    message={
                                                        errors.finance_company_id
                                                    }
                                                    className={
                                                        errorTextClassName
                                                    }
                                                />

                                                {/* PIC Info Card */}
                                                {selectedFinanceCompany && (
                                                    <div className="mt-2 flex flex-wrap items-center justify-between rounded-xl border border-blue-500/20 bg-background/80 px-3.5 py-2.5 text-xs text-muted-foreground">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium text-foreground">
                                                                PIC Marketing:
                                                            </span>
                                                            <span>
                                                                {selectedFinanceCompany.pic_name ??
                                                                    '—'}
                                                            </span>
                                                            {selectedFinanceCompany.pic_phone && (
                                                                <span className="font-mono text-primary">
                                                                    (
                                                                    {
                                                                        selectedFinanceCompany.pic_phone
                                                                    }
                                                                    )
                                                                </span>
                                                            )}
                                                        </div>
                                                        {selectedFinanceCompany.notes && (
                                                            <div className="max-w-sm truncate text-[11px] text-muted-foreground/80 italic">
                                                                {
                                                                    selectedFinanceCompany.notes
                                                                }
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* 2. Porsi Nilai Kredit & Uang Muka (DP) */}
                                            <div className="space-y-3 pt-1">
                                                <Label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                                    2. Skema DP Customer & Pokok
                                                    Hutang Leasing
                                                </Label>

                                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                                    {/* DP Customer */}
                                                    <div className="space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <Label htmlFor="down_payment_credit">
                                                                DP Disetor
                                                                Customer
                                                            </Label>
                                                            {numDealPrice >
                                                                0 && (
                                                                <span className="text-xs font-medium text-muted-foreground">
                                                                    {numDealPrice >
                                                                    0
                                                                        ? Math.round(
                                                                              (numDownPayment /
                                                                                  numDealPrice) *
                                                                                  100,
                                                                          )
                                                                        : 0}
                                                                    % dari Deal
                                                                </span>
                                                            )}
                                                        </div>
                                                        <PriceInput
                                                            id="down_payment_credit"
                                                            name="down_payment"
                                                            value={downPayment}
                                                            onValueChange={
                                                                setDownPayment
                                                            }
                                                            placeholder="0"
                                                            required
                                                            aria-invalid={Boolean(
                                                                errors.down_payment,
                                                            )}
                                                            className={`bg-background ${validationColorClassName}`}
                                                        />
                                                        {/* Quick percentage buttons */}
                                                        <div className="flex items-center gap-1.5 pt-1">
                                                            <span className="text-[11px] text-muted-foreground">
                                                                Preset:
                                                            </span>
                                                            {[
                                                                15, 20, 25, 30,
                                                            ].map((pct) => (
                                                                <Button
                                                                    key={pct}
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="h-6 bg-background px-2 text-[11px] hover:bg-blue-500/10 hover:text-blue-600"
                                                                    onClick={() => {
                                                                        if (
                                                                            numDealPrice >
                                                                            0
                                                                        ) {
                                                                            setDownPayment(
                                                                                String(
                                                                                    Math.round(
                                                                                        (numDealPrice *
                                                                                            pct) /
                                                                                            100,
                                                                                    ),
                                                                                ),
                                                                            );
                                                                        }
                                                                    }}
                                                                >
                                                                    {pct}%
                                                                </Button>
                                                            ))}
                                                        </div>
                                                        <InputError
                                                            message={
                                                                errors.down_payment
                                                            }
                                                            className={
                                                                errorTextClassName
                                                            }
                                                        />
                                                    </div>

                                                    {/* Pokok Pencairan Leasing */}
                                                    <div className="space-y-2">
                                                        <Label htmlFor="finance_amount">
                                                            Pokok Ditalangi /
                                                            Dicairkan Leasing
                                                        </Label>
                                                        <div className="relative">
                                                            <Input
                                                                id="finance_amount"
                                                                value={formatCurrency(
                                                                    numFinanceAmount,
                                                                )}
                                                                readOnly
                                                                className="bg-muted/70 font-semibold text-blue-600 tabular-nums dark:text-blue-400"
                                                            />
                                                        </div>
                                                        <p className="pt-1 text-[11px] text-muted-foreground">
                                                            Otomatis:{' '}
                                                            <strong className="text-foreground">
                                                                {formatCurrency(
                                                                    numDealPrice,
                                                                )}
                                                            </strong>{' '}
                                                            (Deal) -{' '}
                                                            <strong className="text-foreground">
                                                                {formatCurrency(
                                                                    numDownPayment,
                                                                )}
                                                            </strong>{' '}
                                                            (DP)
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* 3. Jadwal Pencairan & Bonus Showroom */}
                                            <div className="space-y-3 pt-1">
                                                <Label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                                    3. Jadwal Pencairan & Komisi
                                                    Showroom
                                                </Label>

                                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                                    {/* Estimasi Tanggal Cair */}
                                                    <div className="grid gap-2">
                                                        <Label htmlFor="disbursement_estimated_date">
                                                            Estimasi Tanggal
                                                            Cair Leasing
                                                        </Label>
                                                        <Input
                                                            id="disbursement_estimated_date"
                                                            name="disbursement_estimated_date"
                                                            type="date"
                                                            value={
                                                                disbursementEstDate
                                                            }
                                                            onChange={(e) =>
                                                                setDisbursementEstDate(
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            required
                                                            aria-invalid={Boolean(
                                                                errors.disbursement_estimated_date,
                                                            )}
                                                            className={`bg-background ${validationColorClassName}`}
                                                        />
                                                        <InputError
                                                            message={
                                                                errors.disbursement_estimated_date
                                                            }
                                                            className={
                                                                errorTextClassName
                                                            }
                                                        />
                                                    </div>

                                                    {/* Bonus Leasing Showroom */}
                                                    <div className="grid gap-2">
                                                        <div className="flex items-center justify-between">
                                                            <Label htmlFor="leasing_bonus">
                                                                Bonus / Komisi
                                                                Leasing
                                                            </Label>
                                                            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                                                                Pendapatan
                                                                Showroom
                                                            </span>
                                                        </div>
                                                        <PriceInput
                                                            id="leasing_bonus"
                                                            name="leasing_bonus"
                                                            value={leasingBonus}
                                                            onValueChange={
                                                                setLeasingBonus
                                                            }
                                                            placeholder="0"
                                                            aria-invalid={Boolean(
                                                                errors.leasing_bonus,
                                                            )}
                                                            className={`bg-background ${validationColorClassName}`}
                                                        />
                                                        <InputError
                                                            message={
                                                                errors.leasing_bonus
                                                            }
                                                            className={
                                                                errorTextClassName
                                                            }
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Visual Cashflow Breakdown Summary */}
                                            <div className="rounded-xl border border-blue-500/20 bg-background p-3.5 text-xs">
                                                <div className="mb-2 flex items-center gap-1.5 font-semibold text-foreground">
                                                    <CoinsIcon className="size-4 text-blue-600" />
                                                    Arus Kas Masuk untuk
                                                    Showroom:
                                                </div>
                                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                                                    <div className="rounded-lg bg-muted/50 p-2 text-center">
                                                        <div className="text-[11px] text-muted-foreground">
                                                            1. Dari Customer
                                                            (DP)
                                                        </div>
                                                        <div className="mt-0.5 font-bold text-emerald-600">
                                                            {formatCurrency(
                                                                numDownPayment,
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="rounded-lg bg-muted/50 p-2 text-center">
                                                        <div className="text-[11px] text-muted-foreground">
                                                            2. Dari Leasing
                                                            (Pokok)
                                                        </div>
                                                        <div className="mt-0.5 font-bold text-blue-600">
                                                            {formatCurrency(
                                                                numFinanceAmount,
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="rounded-lg bg-muted/50 p-2 text-center">
                                                        <div className="text-[11px] text-muted-foreground">
                                                            3. Bonus Leasing
                                                            Showroom
                                                        </div>
                                                        <div className="mt-0.5 font-bold text-indigo-600">
                                                            +
                                                            {formatCurrency(
                                                                numLeasingBonus,
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Initial Payment Checkbox & Bank Info */}
                                    <div className="space-y-4 rounded-xl border p-4">
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="record_initial_payment"
                                                checked={recordInitialPayment}
                                                onCheckedChange={(checked) =>
                                                    setRecordInitialPayment(
                                                        checked === true,
                                                    )
                                                }
                                                disabled={
                                                    paymentType === 'cash_full'
                                                }
                                            />
                                            <Label
                                                htmlFor="record_initial_payment"
                                                className="cursor-pointer text-sm font-medium"
                                            >
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
                                                        <Label htmlFor="sale_payment_date">
                                                            Tanggal Pembayaran /
                                                            Uang Masuk
                                                        </Label>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setPaymentDate(
                                                                    new Date()
                                                                        .toISOString()
                                                                        .split(
                                                                            'T',
                                                                        )[0],
                                                                )
                                                            }
                                                            className="text-xs font-medium text-primary hover:underline"
                                                        >
                                                            Set Tanggal Hari Ini
                                                        </button>
                                                    </div>
                                                    <Input
                                                        id="sale_payment_date"
                                                        name="payment_date"
                                                        type="date"
                                                        value={paymentDate}
                                                        onChange={(e) =>
                                                            setPaymentDate(
                                                                e.target.value,
                                                            )
                                                        }
                                                        required
                                                        aria-invalid={Boolean(
                                                            errors.payment_date,
                                                        )}
                                                        className={
                                                            validationColorClassName
                                                        }
                                                    />
                                                    <p className="text-[11px] text-muted-foreground">
                                                        Secara otomatis terisi
                                                        tanggal hari ini. Ubah
                                                        jika pembayaran diterima
                                                        kemarin atau dijadwalkan
                                                        besok.
                                                    </p>
                                                    <InputError
                                                        message={
                                                            errors.payment_date
                                                        }
                                                        className={
                                                            errorTextClassName
                                                        }
                                                    />
                                                </div>

                                                <div
                                                    className={`grid gap-2 ${paymentMethod !== 'transfer' ? 'sm:col-span-2' : ''}`}
                                                >
                                                    <Label htmlFor="payment_method">
                                                        Metode Pembayaran
                                                    </Label>
                                                    <Select
                                                        value={paymentMethod}
                                                        onValueChange={(val) =>
                                                            setPaymentMethod(
                                                                val as PaymentMethod,
                                                            )
                                                        }
                                                    >
                                                        <SelectTrigger
                                                            id="payment_method"
                                                            aria-invalid={Boolean(
                                                                errors.payment_method,
                                                            )}
                                                        >
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
                                                                Giro / Cek
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                {paymentMethod ===
                                                'transfer' ? (
                                                    <>
                                                        <div className="grid gap-2">
                                                            <Label htmlFor="destination_account">
                                                                Rekening Tujuan
                                                                Showroom{' '}
                                                                <span className="text-red-500">
                                                                    *
                                                                </span>
                                                            </Label>
                                                            <Input
                                                                id="destination_account"
                                                                name="destination_account"
                                                                value={
                                                                    destinationAccount
                                                                }
                                                                onChange={(e) =>
                                                                    setDestinationAccount(
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                                placeholder="Contoh: BCA Showroom (0123-456-789)"
                                                                required
                                                            />
                                                        </div>

                                                        <div className="grid gap-2 sm:col-span-2">
                                                            <Label htmlFor="reference_number">
                                                                No. Referensi /
                                                                Berita Transfer
                                                                (Opsional)
                                                            </Label>
                                                            <Input
                                                                id="reference_number"
                                                                name="reference_number"
                                                                value={
                                                                    referenceNumber
                                                                }
                                                                onChange={(e) =>
                                                                    setReferenceNumber(
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                                placeholder="Contoh: TRX-12345"
                                                            />
                                                        </div>
                                                    </>
                                                ) : (
                                                    <input
                                                        type="hidden"
                                                        name="destination_account"
                                                        value={
                                                            paymentMethod ===
                                                            'cash'
                                                                ? 'Kas Tunai Showroom'
                                                                : 'Kas Showroom'
                                                        }
                                                    />
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Notes */}
                                    <div className="grid gap-2">
                                        <Label htmlFor="notes">
                                            Catatan Transaksi / Perjanjian
                                            Tambahan (Opsional)
                                        </Label>
                                        <Input
                                            id="notes"
                                            name="notes"
                                            value={notes}
                                            onChange={(e) =>
                                                setNotes(e.target.value)
                                            }
                                            placeholder="Catatan garansi, bonus servis, janji serah terima dokumen, dll."
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right Column: Order Summary Card */}
                        <div className="space-y-6">
                            <Card className="sticky top-6 overflow-hidden border-primary/20 p-0 shadow-xs">
                                <div className="border-b bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-5">
                                    <div className="flex items-center gap-3">
                                        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                                            <CurrencyCircleDollarIcon
                                                className="size-6"
                                                weight="fill"
                                            />
                                        </div>
                                        <div>
                                            <div className="font-semibold">
                                                Ringkasan SPK Penjualan
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                Kalkulasi finansial transaksi.
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <CardContent className="space-y-4 p-5 text-sm">
                                    <div className="rounded-xl border bg-card p-4">
                                        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                            <CarProfileIcon className="size-4 text-primary" />
                                            Unit mobil
                                        </div>
                                        <div className="mt-2 font-semibold">
                                            {[
                                                selectedCar?.brand?.name,
                                                selectedCar?.name,
                                            ]
                                                .filter(Boolean)
                                                .join(' ') ||
                                                'Belum memilih unit'}
                                        </div>
                                        <div className="mt-0.5 text-xs text-muted-foreground">
                                            {selectedCar?.license_plate ??
                                                'Nomor polisi belum tersedia'}
                                        </div>
                                    </div>

                                    <div className="grid gap-3">
                                        <div className="rounded-xl border bg-card p-4">
                                            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                                <MoneyIcon className="size-4 text-emerald-600" />
                                                Harga kesepakatan
                                            </div>
                                            <div className="mt-2 text-lg font-bold text-emerald-600 tabular-nums dark:text-emerald-500">
                                                {formatCurrency(numDealPrice)}
                                            </div>
                                        </div>

                                        <div className="rounded-xl border bg-card p-4">
                                            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                                <CoinsIcon className="size-4" />
                                                Total modal
                                            </div>
                                            <div className="mt-2 text-lg font-bold tabular-nums">
                                                {formatCurrency(totalCapital)}
                                            </div>
                                        </div>

                                        <div className="rounded-xl border bg-card p-4">
                                            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                                <CurrencyCircleDollarIcon className="size-4" />
                                                Estimasi keuntungan
                                            </div>
                                            <div
                                                className={`mt-2 text-lg font-bold tabular-nums ${
                                                    estimatedProfit < 0
                                                        ? 'text-rose-600'
                                                        : 'text-blue-600 dark:text-blue-500'
                                                }`}
                                            >
                                                {formatCurrency(
                                                    estimatedProfit,
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {paymentType === 'cash_full' && (
                                        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                                            <div className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                                                Bayar lunas hari ini
                                            </div>
                                            <div className="mt-1 text-xl font-bold text-emerald-600 tabular-nums dark:text-emerald-500">
                                                {formatCurrency(numDealPrice)}
                                            </div>
                                        </div>
                                    )}

                                    {paymentType === 'cash_tempo' && (
                                        <div className="space-y-3 rounded-xl border bg-muted/20 p-4">
                                            <div className="flex items-center justify-between gap-4">
                                                <span className="text-muted-foreground">
                                                    Uang muka (DP)
                                                </span>
                                                <span className="font-semibold text-emerald-600 tabular-nums dark:text-emerald-500">
                                                    {formatCurrency(
                                                        numDownPayment,
                                                    )}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between gap-4 border-t pt-3">
                                                <span className="text-muted-foreground">
                                                    Sisa pelunasan tempo
                                                </span>
                                                <span className="font-semibold text-amber-600 tabular-nums dark:text-amber-500">
                                                    {formatCurrency(
                                                        numRemainingTempo,
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {paymentType === 'trade_in' && (
                                        <div className="space-y-3 rounded-xl border border-purple-500/20 bg-purple-500/5 p-4 dark:bg-purple-500/10">
                                            <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-700 dark:text-purple-400">
                                                <ArrowsLeftRightIcon className="size-4" />
                                                Skema Tukar Tambah
                                            </div>
                                            <div className="space-y-1 text-xs">
                                                <div className="text-muted-foreground">
                                                    Unit Ditukar:{' '}
                                                    <strong className="text-foreground">
                                                        {tradeInCarName ||
                                                            'Belum diisi'}{' '}
                                                        {tradeInBrand
                                                            ? `(${tradeInBrand})`
                                                            : ''}
                                                    </strong>
                                                </div>
                                                {tradeInLicensePlate && (
                                                    <div className="font-mono text-xs font-medium text-foreground">
                                                        Plat:{' '}
                                                        {tradeInLicensePlate}
                                                    </div>
                                                )}
                                                {tradeInYear && (
                                                    <div className="text-muted-foreground">
                                                        Tahun: {tradeInYear} •
                                                        Warna:{' '}
                                                        {tradeInColor || '—'}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="space-y-2 border-t border-purple-500/20 pt-2 text-xs">
                                                <div className="flex items-center justify-between gap-4">
                                                    <span className="text-muted-foreground">
                                                        Nilai mobil tukar tambah
                                                    </span>
                                                    <span className="font-semibold text-purple-600 tabular-nums dark:text-purple-400">
                                                        -{' '}
                                                        {formatCurrency(
                                                            numTradeInPrice,
                                                        )}
                                                    </span>
                                                </div>
                                                {numDownPayment > 0 && (
                                                    <div className="flex items-center justify-between gap-4">
                                                        <span className="text-muted-foreground">
                                                            Tambahan uang kas
                                                            (DP)
                                                        </span>
                                                        <span className="font-semibold text-emerald-600 tabular-nums dark:text-emerald-500">
                                                            -{' '}
                                                            {formatCurrency(
                                                                numDownPayment,
                                                            )}
                                                        </span>
                                                    </div>
                                                )}
                                                <div className="flex items-center justify-between gap-4 border-t border-purple-500/20 pt-2 font-medium">
                                                    <span className="text-foreground">
                                                        Sisa piutang showroom
                                                    </span>
                                                    <span className="font-bold text-amber-600 tabular-nums dark:text-amber-500">
                                                        {formatCurrency(
                                                            numRemainingTradeIn,
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {paymentType === 'credit' && (
                                        <div className="space-y-3 rounded-xl border bg-muted/20 p-4">
                                            <div className="flex items-center justify-between gap-4">
                                                <span className="text-muted-foreground">
                                                    DP dari customer
                                                </span>
                                                <span className="font-semibold text-emerald-600 tabular-nums dark:text-emerald-500">
                                                    {formatCurrency(
                                                        numDownPayment,
                                                    )}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between gap-4 border-t pt-3">
                                                <span className="text-muted-foreground">
                                                    Pokok cair leasing
                                                </span>
                                                <span className="font-semibold text-blue-600 tabular-nums dark:text-blue-500">
                                                    {formatCurrency(
                                                        numFinanceAmount,
                                                    )}
                                                </span>
                                            </div>
                                            {numLeasingBonus > 0 && (
                                                <div className="flex items-center justify-between gap-4 border-t pt-3">
                                                    <span className="text-muted-foreground">
                                                        Bonus leasing showroom
                                                    </span>
                                                    <span className="font-semibold text-indigo-600 tabular-nums dark:text-indigo-400">
                                                        +
                                                        {formatCurrency(
                                                            numLeasingBonus,
                                                        )}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="space-y-3 border-t pt-4">
                                        <Button
                                            type="submit"
                                            disabled={
                                                processing ||
                                                availableCars.length === 0
                                            }
                                            className="h-11 w-full text-base"
                                        >
                                            {processing ? (
                                                <Spinner />
                                            ) : (
                                                <FloppyDiskIcon className="size-5" />
                                            )}
                                            Terbitkan SPK Penjualan
                                        </Button>

                                        <Button
                                            variant="outline"
                                            asChild
                                            className="w-full"
                                        >
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

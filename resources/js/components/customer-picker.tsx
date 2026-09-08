/* eslint-disable react-hooks/set-state-in-effect */
import {
    CheckCircleIcon,
    MagnifyingGlassIcon,
    XIcon,
} from '@phosphor-icons/react';
import { useEffect, useMemo, useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export type CustomerPickerItem = {
    id: number;
    name: string;
    phone?: string | null;
    ktp_number?: string | null;
    address?: string | null;
};

export function customerPickerLabel(customer: CustomerPickerItem): string {
    const phone = customer.phone ? ` (${customer.phone})` : '';

    return `${customer.name}${phone}`.trim();
}

function customerSearchText(customer: CustomerPickerItem): string {
    return [
        customer.name,
        customer.phone,
        customer.ktp_number,
        customer.address,
    ]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase('id-ID');
}

export type CustomerPickerProps<T extends CustomerPickerItem> = {
    customers: T[];
    value?: string | number | null;
    onSelect: (customer: T | null) => void;
    id?: string;
    name?: string;
    label?: string;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    error?: string;
    className?: string;
    emptyText?: string;
    showSelectedHelper?: boolean;
};

export function CustomerPicker<T extends CustomerPickerItem>({
    customers,
    value,
    onSelect,
    id = 'customer-picker-search',
    name,
    label = 'Pelanggan / Pembeli',
    placeholder = 'Cari nama pembeli, nomor telepon, atau NIK KTP...',
    required = false,
    disabled = false,
    error,
    className,
    emptyText = 'Tidak ada data customer.',
    showSelectedHelper = false,
}: CustomerPickerProps<T>) {
    const selectedCustomer = useMemo(
        () =>
            value !== undefined && value !== null && value !== ''
                ? (customers.find((c) => String(c.id) === String(value)) ??
                  null)
                : null,
        [customers, value],
    );

    const [search, setSearch] = useState(
        selectedCustomer ? customerPickerLabel(selectedCustomer) : '',
    );
    const [isListOpen, setIsListOpen] = useState(false);

    useEffect(() => {
        if (selectedCustomer) {
            setSearch(customerPickerLabel(selectedCustomer));
        } else if (value === undefined || value === null || value === '') {
            setSearch('');
        }
    }, [selectedCustomer, value]);

    const normalizedSearch = search.trim().toLocaleLowerCase('id-ID');

    const matchingCustomers = useMemo(
        () =>
            normalizedSearch === ''
                ? customers
                : customers.filter((customer) =>
                      customerSearchText(customer).includes(normalizedSearch),
                  ),
        [customers, normalizedSearch],
    );

    const visibleCustomers = matchingCustomers.slice(0, 10);

    function handleSelect(customer: T) {
        onSelect(customer);
        setSearch(customerPickerLabel(customer));
        setIsListOpen(false);
    }

    function handleClear() {
        onSelect(null);
        setSearch('');
        setIsListOpen(true);
    }

    return (
        <div className={cn('grid gap-2', className)}>
            {label && (
                <Label htmlFor={id}>
                    {label}
                    {required && <span className="ml-1 text-red-500">*</span>}
                </Label>
            )}

            {name && (
                <input
                    type="hidden"
                    name={name}
                    value={value !== null && value !== undefined ? value : ''}
                />
            )}

            {customers.length > 0 ? (
                <div
                    className="relative"
                    onBlur={(event) => {
                        const nextTarget = event.relatedTarget as Node | null;

                        if (
                            !nextTarget ||
                            !event.currentTarget.contains(nextTarget)
                        ) {
                            setIsListOpen(false);

                            if (selectedCustomer) {
                                setSearch(
                                    customerPickerLabel(selectedCustomer),
                                );
                            } else {
                                setSearch('');
                            }
                        }
                    }}
                >
                    <div className="relative">
                        <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            id={id}
                            type="search"
                            value={search}
                            disabled={disabled}
                            onFocus={() => setIsListOpen(true)}
                            onChange={(event) => {
                                const val = event.target.value;
                                setSearch(val);
                                setIsListOpen(true);

                                if (
                                    selectedCustomer &&
                                    val !==
                                        customerPickerLabel(selectedCustomer)
                                ) {
                                    onSelect(null);
                                }
                            }}
                            placeholder={placeholder}
                            autoComplete="off"
                            aria-expanded={isListOpen}
                            aria-controls={`${id}-results`}
                            aria-invalid={Boolean(error)}
                            className={cn(
                                'pr-10 pl-9',
                                Boolean(error) &&
                                    'border-red-500 ring-red-500/20 dark:ring-red-500/40',
                            )}
                        />
                        {search !== '' && !disabled && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={handleClear}
                                aria-label="Hapus pilihan customer"
                                className="absolute top-1/2 right-1 size-8 -translate-y-1/2"
                            >
                                <XIcon />
                            </Button>
                        )}
                    </div>

                    {isListOpen && !disabled && (
                        <div
                            id={`${id}-results`}
                            role="listbox"
                            className="absolute z-50 mt-1 max-h-72 w-full overflow-y-auto rounded-lg border bg-popover p-1 text-popover-foreground shadow-md"
                        >
                            {visibleCustomers.length === 0 ? (
                                <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                                    Customer tidak ditemukan.
                                </p>
                            ) : (
                                visibleCustomers.map((customer) => {
                                    const isSelected =
                                        selectedCustomer !== null &&
                                        selectedCustomer.id === customer.id;

                                    return (
                                        <button
                                            key={customer.id}
                                            type="button"
                                            role="option"
                                            aria-selected={isSelected}
                                            onClick={() =>
                                                handleSelect(customer)
                                            }
                                            className={cn(
                                                'flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none',
                                                isSelected && 'bg-primary/10',
                                            )}
                                        >
                                            <div className="min-w-0 flex-1">
                                                <p className="font-semibold text-foreground">
                                                    {customer.name}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {customer.phone
                                                        ? customer.phone
                                                        : 'Tanpa nomor telepon'}
                                                    {customer.ktp_number
                                                        ? ` · NIK: ${customer.ktp_number}`
                                                        : ''}
                                                    {customer.address
                                                        ? ` · ${customer.address}`
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
                                })
                            )}

                            {matchingCustomers.length > 10 && (
                                <p className="border-t px-3 py-2 text-xs text-muted-foreground">
                                    Menampilkan 10 dari{' '}
                                    {matchingCustomers.length} customer yang
                                    cocok. Ketik lebih spesifik untuk
                                    mempersempit.
                                </p>
                            )}
                        </div>
                    )}
                </div>
            ) : (
                <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                    {emptyText}
                </div>
            )}

            {showSelectedHelper && selectedCustomer && (
                <p className="text-xs text-muted-foreground">
                    Customer terpilih:{' '}
                    <span className="font-medium text-foreground">
                        {customerPickerLabel(selectedCustomer)}
                    </span>
                </p>
            )}

            <InputError
                message={error}
                className="text-red-500 dark:text-red-500"
            />
        </div>
    );
}

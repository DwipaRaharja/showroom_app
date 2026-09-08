/* eslint-disable react-hooks/set-state-in-effect */
import { Link } from '@inertiajs/react';
import {
    CheckCircleIcon,
    MagnifyingGlassIcon,
    XIcon,
} from '@phosphor-icons/react';
import { useEffect, useMemo, useState } from 'react';
import DocumentProcessController from '@/actions/App/Http/Controllers/DocumentProcessController';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';

export type CarPickerItem = {
    id: number;
    name: string;
    license_plate: string | null;
    year?: number | string | null;
    color?: string | null;
    mileage?: number | null;
    transmission?: string | null;
    selling_price?: number | null;
    status?: string | null;
    brand?: {
        id?: number;
        name: string;
    } | null;
    has_active_process?: boolean;
    active_process_id?: number | null;
    active_process_type?: string | null;
};

export function carPickerLabel(car: CarPickerItem): string {
    const brandName = car.brand?.name ? `${car.brand.name} ` : '';
    const plate = car.license_plate ? ` (${car.license_plate})` : '';

    return `${brandName}${car.name}${plate}`.trim();
}

function carSearchText(car: CarPickerItem): string {
    return [
        car.brand?.name,
        car.name,
        car.license_plate,
        car.year ? String(car.year) : '',
        car.color,
        car.transmission,
    ]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase('id-ID');
}

export type CarPickerProps<T extends CarPickerItem> = {
    cars: T[];
    value?: string | number | null;
    onSelect: (car: T | null) => void;
    id?: string;
    name?: string;
    label?: string;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    error?: string;
    activeProcessId?: number | string | null;
    className?: string;
    emptyText?: string;
    showSelectedHelper?: boolean;
};

export function CarPicker<T extends CarPickerItem>({
    cars,
    value,
    onSelect,
    id = 'car-picker-search',
    name,
    label = 'Unit Kendaraan',
    placeholder = 'Cari nama mobil, merek, atau plat nomor...',
    required = false,
    disabled = false,
    error,
    activeProcessId,
    className,
    emptyText = 'Tidak ada unit mobil yang tersedia.',
    showSelectedHelper = false,
}: CarPickerProps<T>) {
    const selectedCar = useMemo(
        () =>
            value !== undefined && value !== null && value !== ''
                ? (cars.find((c) => String(c.id) === String(value)) ?? null)
                : null,
        [cars, value],
    );

    const [search, setSearch] = useState(
        selectedCar ? carPickerLabel(selectedCar) : '',
    );
    const [isListOpen, setIsListOpen] = useState(false);

    useEffect(() => {
        if (selectedCar) {
            setSearch(carPickerLabel(selectedCar));
        } else if (value === undefined || value === null || value === '') {
            setSearch('');
        }
    }, [selectedCar, value]);

    const normalizedSearch = search.trim().toLocaleLowerCase('id-ID');

    const matchingCars = useMemo(
        () =>
            normalizedSearch === ''
                ? cars
                : cars.filter((car) =>
                      carSearchText(car).includes(normalizedSearch),
                  ),
        [cars, normalizedSearch],
    );

    const visibleCars = matchingCars.slice(0, 10);

    function handleSelect(car: T) {
        onSelect(car);
        setSearch(carPickerLabel(car));
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

            {cars.length > 0 ? (
                <div
                    className="relative"
                    onBlur={(event) => {
                        const nextTarget = event.relatedTarget as Node | null;

                        if (
                            !nextTarget ||
                            !event.currentTarget.contains(nextTarget)
                        ) {
                            setIsListOpen(false);

                            if (selectedCar) {
                                setSearch(carPickerLabel(selectedCar));
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
                                    selectedCar &&
                                    val !== carPickerLabel(selectedCar)
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
                                aria-label="Hapus pilihan kendaraan"
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
                            {visibleCars.length === 0 ? (
                                <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                                    Mobil tidak ditemukan.
                                </p>
                            ) : (
                                visibleCars.map((car) => {
                                    const isSelected =
                                        selectedCar !== null &&
                                        selectedCar.id === car.id;

                                    return (
                                        <button
                                            key={car.id}
                                            type="button"
                                            role="option"
                                            aria-selected={isSelected}
                                            onClick={() => handleSelect(car)}
                                            className={cn(
                                                'flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none',
                                                isSelected && 'bg-primary/10',
                                            )}
                                        >
                                            <div className="min-w-0 flex-1">
                                                <p className="font-semibold text-foreground">
                                                    {car.brand?.name
                                                        ? `${car.brand.name} `
                                                        : ''}
                                                    {car.name}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    <span className="font-mono font-medium text-foreground/80">
                                                        {car.license_plate ??
                                                            'Tanpa plat'}
                                                    </span>
                                                    {car.year
                                                        ? ` · Th ${car.year}`
                                                        : ''}
                                                    {car.color
                                                        ? ` · ${car.color}`
                                                        : ''}
                                                    {car.transmission
                                                        ? ` · ${car.transmission}`
                                                        : ''}
                                                    {car.status
                                                        ? ` · ${car.status}`
                                                        : ''}
                                                </p>
                                            </div>
                                            <div className="flex shrink-0 items-center gap-2 text-right">
                                                {car.selling_price ? (
                                                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                                        {formatCurrency(
                                                            car.selling_price,
                                                        )}
                                                    </span>
                                                ) : null}
                                                {isSelected && (
                                                    <CheckCircleIcon
                                                        weight="fill"
                                                        className="size-5 shrink-0 text-primary"
                                                    />
                                                )}
                                            </div>
                                        </button>
                                    );
                                })
                            )}

                            {matchingCars.length > 10 && (
                                <p className="border-t px-3 py-2 text-xs text-muted-foreground">
                                    Menampilkan 10 dari {matchingCars.length}{' '}
                                    mobil yang cocok. Ketik lebih spesifik untuk
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

            {showSelectedHelper && selectedCar && (
                <p className="text-xs text-muted-foreground">
                    Mobil terpilih:{' '}
                    <span className="font-medium text-foreground">
                        {carPickerLabel(selectedCar)}
                    </span>
                </p>
            )}

            <InputError
                message={error}
                className="text-red-500 dark:text-red-500"
            />

            {activeProcessId && (
                <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="h-auto w-fit p-0 text-red-500 dark:text-red-500"
                    asChild
                >
                    <Link
                        href={DocumentProcessController.show.url(
                            Number(activeProcessId),
                        )}
                    >
                        Lihat proses berkas aktif →
                    </Link>
                </Button>
            )}
        </div>
    );
}

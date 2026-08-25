import { Form, Link } from '@inertiajs/react';
import {
    CheckCircleIcon,
    FloppyDiskIcon,
    MagnifyingGlassIcon,
    XIcon,
} from '@phosphor-icons/react';
import { useMemo, useState } from 'react';
import DocumentProcessController from '@/actions/App/Http/Controllers/DocumentProcessController';
import InputError from '@/components/input-error';
import { PriceInput } from '@/components/price-input';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
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
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type {
    DocumentProcessType,
    LabelOptions,
    ProcessCar,
    UserOption,
} from '@/pages/document-processes/types';

type Props = {
    cars: ProcessCar[];
    users: UserOption[];
    typeOptions: LabelOptions;
    initialCarId?: number | null;
};

function today(): string {
    const date = new Date();
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);

    return local.toISOString().slice(0, 10);
}

function carLabel(car: ProcessCar): string {
    return [car.brand?.name, car.name, car.license_plate ?? 'Tanpa plat']
        .filter(Boolean)
        .join(' · ');
}

function carSearchText(car: ProcessCar): string {
    return [car.brand?.name, car.name, car.license_plate]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase('id-ID');
}

export function ProcessForm({
    cars,
    users,
    typeOptions,
    initialCarId = null,
}: Props) {
    const initialCar = cars.find((car) => car.id === initialCarId) ?? null;
    const [carId, setCarId] = useState(
        initialCarId === null ? '' : String(initialCarId),
    );
    const [carSearch, setCarSearch] = useState(
        initialCar === null ? '' : carLabel(initialCar),
    );
    const [isCarListOpen, setIsCarListOpen] = useState(false);
    const [processType, setProcessType] =
        useState<DocumentProcessType>('annual_tax');
    const [assignedTo, setAssignedTo] = useState('none');
    const [initialCost, setInitialCost] = useState('');
    const [paidBy, setPaidBy] = useState('showroom');
    const selectedCar = cars.find((car) => String(car.id) === carId) ?? null;
    const normalizedCarSearch = carSearch.trim().toLocaleLowerCase('id-ID');
    const matchingCars = useMemo(
        () =>
            normalizedCarSearch === ''
                ? cars
                : cars.filter((car) =>
                      carSearchText(car).includes(normalizedCarSearch),
                  ),
        [cars, normalizedCarSearch],
    );
    const visibleCars = matchingCars.slice(0, 10);

    function selectCar(car: ProcessCar) {
        setCarId(String(car.id));
        setCarSearch(carLabel(car));
        setIsCarListOpen(false);
    }

    function clearCar() {
        setCarId('');
        setCarSearch('');
        setIsCarListOpen(true);
    }

    return (
        <Form action={DocumentProcessController.store.url()} method="post">
            {({ processing, errors }) => (
                <Card>
                    <CardHeader className="border-b">
                        <CardTitle>Informasi Proses</CardTitle>
                        <CardDescription>
                            Isi data pekerjaan pengurusan berkas untuk satu
                            kendaraan.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6">
                        <input type="hidden" name="car_id" value={carId} />
                        <input
                            type="hidden"
                            name="process_type"
                            value={processType}
                        />
                        <input
                            type="hidden"
                            name="assigned_to"
                            value={assignedTo === 'none' ? '' : assignedTo}
                        />
                        <input
                            type="hidden"
                            name="initial_cost_paid_by"
                            value={paidBy}
                        />

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-1.5 sm:col-span-2">
                                <Label htmlFor="car-search">Kendaraan</Label>
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
                                            id="car-search"
                                            type="search"
                                            value={carSearch}
                                            onFocus={() =>
                                                setIsCarListOpen(true)
                                            }
                                            onChange={(event) => {
                                                const value =
                                                    event.target.value;

                                                setCarSearch(value);
                                                setIsCarListOpen(true);

                                                if (
                                                    selectedCar &&
                                                    value !==
                                                        carLabel(selectedCar)
                                                ) {
                                                    setCarId('');
                                                }
                                            }}
                                            placeholder="Cari nama mobil, merek, atau nomor polisi..."
                                            autoComplete="off"
                                            aria-expanded={isCarListOpen}
                                            aria-controls="car-search-results"
                                            className="pr-10 pl-9"
                                        />
                                        {carSearch !== '' && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={clearCar}
                                                aria-label="Hapus pilihan kendaraan"
                                                className="absolute top-1/2 right-1 size-8 -translate-y-1/2"
                                            >
                                                <XIcon />
                                            </Button>
                                        )}
                                    </div>

                                    {isCarListOpen && (
                                        <div
                                            id="car-search-results"
                                            role="listbox"
                                            className="absolute z-50 mt-1 max-h-72 w-full overflow-y-auto rounded-lg border bg-popover p-1 text-popover-foreground shadow-md"
                                        >
                                            {visibleCars.length === 0 ? (
                                                <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                                                    Mobil tidak ditemukan.
                                                </p>
                                            ) : (
                                                visibleCars.map((car) => {
                                                    const isSelected =
                                                        carId ===
                                                        String(car.id);

                                                    return (
                                                        <button
                                                            key={car.id}
                                                            type="button"
                                                            role="option"
                                                            aria-selected={
                                                                isSelected
                                                            }
                                                            onClick={() =>
                                                                selectCar(car)
                                                            }
                                                            className={cn(
                                                                'flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none',
                                                                isSelected &&
                                                                    'bg-primary/10',
                                                            )}
                                                        >
                                                            <div className="min-w-0 flex-1">
                                                                <p className="font-medium">
                                                                    {
                                                                        car
                                                                            .brand
                                                                            ?.name
                                                                    }{' '}
                                                                    {car.name}
                                                                </p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {car.license_plate ??
                                                                        'Tanpa plat'}{' '}
                                                                    ·{' '}
                                                                    {car.status}
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

                                            {matchingCars.length > 10 && (
                                                <p className="border-t px-3 py-2 text-xs text-muted-foreground">
                                                    Menampilkan 10 dari{' '}
                                                    {matchingCars.length} mobil.
                                                    Ketik pencarian lebih
                                                    spesifik.
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                                {selectedCar && (
                                    <p className="text-xs text-muted-foreground">
                                        Mobil terpilih: {carLabel(selectedCar)}
                                    </p>
                                )}
                                <InputError message={errors.car_id} />
                            </div>

                            <div className="grid gap-1.5 sm:col-span-2">
                                <Label>Jenis proses</Label>
                                <Select
                                    value={processType}
                                    onValueChange={(value) =>
                                        setProcessType(
                                            value as DocumentProcessType,
                                        )
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih jenis proses" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(typeOptions).map(
                                            ([value, label]) => (
                                                <SelectItem
                                                    key={value}
                                                    value={value}
                                                >
                                                    {label}
                                                </SelectItem>
                                            ),
                                        )}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.process_type} />
                            </div>

                            <div className="grid gap-1.5">
                                <Label htmlFor="process-started-at">
                                    Tanggal mulai
                                </Label>
                                <Input
                                    id="process-started-at"
                                    name="started_at"
                                    type="date"
                                    defaultValue={today()}
                                />
                                <InputError message={errors.started_at} />
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor="process-estimated-at">
                                    Target selesai
                                </Label>
                                <Input
                                    id="process-estimated-at"
                                    name="estimated_completion_date"
                                    type="date"
                                />
                                <InputError
                                    message={errors.estimated_completion_date}
                                />
                            </div>

                            <div className="grid gap-1.5 sm:col-span-2">
                                <Label>Penanggung jawab</Label>
                                <Select
                                    value={assignedTo}
                                    onValueChange={setAssignedTo}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih penanggung jawab" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">
                                            Belum ditentukan
                                        </SelectItem>
                                        {users.map((user) => (
                                            <SelectItem
                                                key={user.id}
                                                value={String(user.id)}
                                            >
                                                {user.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-1.5">
                                <Label htmlFor="processor-name">
                                    Biro jasa / petugas luar (opsional)
                                </Label>
                                <Input
                                    id="processor-name"
                                    name="processor_name"
                                    placeholder="Contoh: Biro Jasa Andi"
                                />
                                <InputError message={errors.processor_name} />
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor="processor-phone">
                                    Nomor kontak (opsional)
                                </Label>
                                <Input
                                    id="processor-phone"
                                    name="processor_phone"
                                    placeholder="Contoh: 0812 3456 7890"
                                />
                                <InputError message={errors.processor_phone} />
                            </div>

                            {processType === 'name_transfer' && (
                                <div className="grid gap-1.5 sm:col-span-2">
                                    <Label htmlFor="target-owner">
                                        Nama pemilik baru
                                    </Label>
                                    <Input
                                        id="target-owner"
                                        name="target_owner_name"
                                        placeholder="Contoh: Muhammad Ramadhan"
                                    />
                                    <InputError
                                        message={errors.target_owner_name}
                                    />
                                </div>
                            )}

                            {processType === 'mutation' && (
                                <>
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="origin-region">
                                            Daerah asal
                                        </Label>
                                        <Input
                                            id="origin-region"
                                            name="origin_region"
                                            placeholder="Contoh: Makassar"
                                        />
                                    </div>
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="destination-region">
                                            Daerah tujuan
                                        </Label>
                                        <Input
                                            id="destination-region"
                                            name="destination_region"
                                            placeholder="Contoh: Gowa"
                                        />
                                        <InputError
                                            message={errors.destination_region}
                                        />
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                                <h3 className="font-semibold">Biaya proses</h3>
                                <p className="text-xs text-muted-foreground">
                                    Wajib isi biaya awal proses. Biaya yang
                                    dibayar showroom otomatis menambah modal
                                    kendaraan, sedangkan biaya customer hanya
                                    dicatat pada riwayat.
                                </p>
                            </div>
                            <div className="grid gap-1.5">
                                <Label>Dibayar oleh</Label>
                                <Select
                                    value={paidBy}
                                    onValueChange={setPaidBy}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih pihak pembayar" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="showroom">
                                            Showroom (masuk modal)
                                        </SelectItem>
                                        <SelectItem value="customer">
                                            Customer
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError
                                    message={errors.initial_cost_paid_by}
                                />
                            </div>
                            <div className="grid gap-1.5">
                                <Label>Jumlah biaya</Label>
                                <PriceInput
                                    name="initial_cost"
                                    value={initialCost}
                                    onValueChange={setInitialCost}
                                    placeholder="Contoh: 1.500.000"
                                    required
                                    aria-invalid={Boolean(errors.initial_cost)}
                                />
                                <InputError message={errors.initial_cost} />
                            </div>
                        </div>

                        <div className="grid gap-1.5">
                            <Label htmlFor="process-notes">Catatan</Label>
                            <Textarea
                                id="process-notes"
                                name="notes"
                                rows={3}
                                placeholder="Contoh: Dokumen STNK masih menunggu diserahkan oleh pemilik."
                            />
                        </div>

                        <div className="flex flex-col-reverse gap-2 border-t pt-6 sm:flex-row sm:justify-end">
                            <Button type="button" variant="outline" asChild>
                                <Link
                                    href={DocumentProcessController.index.url()}
                                >
                                    Batal
                                </Link>
                            </Button>
                            <Button
                                type="submit"
                                disabled={
                                    processing ||
                                    carId === '' ||
                                    initialCost === ''
                                }
                            >
                                {processing ? <Spinner /> : <FloppyDiskIcon />}
                                Simpan proses
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </Form>
    );
}

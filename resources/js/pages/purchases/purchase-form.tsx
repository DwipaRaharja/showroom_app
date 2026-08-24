import { Form, Link } from '@inertiajs/react';
import {
    CalculatorIcon,
    FloppyDiskIcon,
    WarningCircleIcon,
} from '@phosphor-icons/react';
import { useMemo, useState } from 'react';
import CarController from '@/actions/App/Http/Controllers/CarController';
import PurchaseController from '@/actions/App/Http/Controllers/PurchaseController';
import InputError from '@/components/input-error';
import { PriceInput } from '@/components/price-input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
import type {
    PurchaseCar,
    PurchaseFormValue,
    PurchaseStatus,
} from '@/pages/purchases/types';
import { index as purchasesIndex } from '@/routes/purchases';

type Props = {
    purchase: PurchaseFormValue | null;
    cars: PurchaseCar[];
    selectedCarId?: number | null;
};

const validationColorClassName =
    'aria-invalid:border-red-500 aria-invalid:ring-red-500/20 dark:aria-invalid:ring-red-500/40';
const errorTextClassName = 'text-red-500 dark:text-red-500';

const currencyFormatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
});

function today(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

function numericValue(value: string): number {
    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : 0;
}

export function PurchaseForm({ purchase, cars, selectedCarId = null }: Props) {
    const isEditing = purchase !== null;
    const [carId, setCarId] = useState(
        purchase?.car_id
            ? String(purchase.car_id)
            : selectedCarId && cars.some((car) => car.id === selectedCarId)
              ? String(selectedCarId)
              : cars[0]?.id
                ? String(cars[0].id)
                : '',
    );
    const [purchaseDate, setPurchaseDate] = useState(
        purchase?.purchase_date.slice(0, 10) ?? today(),
    );
    const [price, setPrice] = useState(purchase ? String(purchase.price) : '');
    const [repairCost, setRepairCost] = useState(
        String(purchase?.repair_cost ?? 0),
    );
    const [transportCost, setTransportCost] = useState(
        String(purchase?.transport_cost ?? 0),
    );
    const [otherCost, setOtherCost] = useState(
        String(purchase?.other_cost ?? 0),
    );
    const [status, setStatus] = useState<PurchaseStatus>(
        purchase?.status ?? 'completed',
    );
    const [notes, setNotes] = useState(purchase?.notes ?? '');
    const totalCapital = useMemo(
        () =>
            numericValue(price) +
            numericValue(repairCost) +
            numericValue(transportCost) +
            numericValue(otherCost),
        [price, repairCost, transportCost, otherCost],
    );

    const formDefinition = isEditing
        ? PurchaseController.update.form(purchase.id)
        : PurchaseController.store.form();
    const hasCars = cars.length > 0;

    return (
        <Form {...formDefinition} className="space-y-6">
            {({ processing, errors }) => (
                <>
                    <input type="hidden" name="car_id" value={carId} />
                    <input type="hidden" name="status" value={status} />

                    {!hasCars && (
                        <Alert variant="destructive">
                            <WarningCircleIcon />
                            <AlertTitle>
                                Tidak ada mobil yang dapat dipilih
                            </AlertTitle>
                            <AlertDescription>
                                Tambahkan unit mobil atau pilih mobil yang belum
                                memiliki data modal.{' '}
                                <Link
                                    href={CarController.create()}
                                    className="font-medium underline underline-offset-4"
                                >
                                    Tambah mobil
                                </Link>
                            </AlertDescription>
                        </Alert>
                    )}

                    <Card>
                        <CardHeader>
                            <CardTitle>Unit kendaraan</CardTitle>
                            <CardDescription>
                                Setiap mobil memiliki satu catatan modal utama.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-5 sm:grid-cols-2">
                            <div className="grid gap-2 sm:col-span-2">
                                <Label htmlFor="capital-car">Mobil</Label>
                                <Select
                                    value={carId}
                                    onValueChange={setCarId}
                                    disabled={!hasCars || isEditing}
                                >
                                    <SelectTrigger
                                        id="capital-car"
                                        aria-invalid={Boolean(errors.car_id)}
                                        className={validationColorClassName}
                                    >
                                        <SelectValue placeholder="Pilih unit mobil" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {cars.map((car) => (
                                            <SelectItem
                                                key={car.id}
                                                value={String(car.id)}
                                            >
                                                {car.brand?.name
                                                    ? `${car.brand.name} `
                                                    : ''}
                                                {car.name} · {car.year}
                                                {car.license_plate
                                                    ? ` · ${car.license_plate}`
                                                    : ''}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError
                                    message={errors.car_id}
                                    className={errorTextClassName}
                                />
                                {isEditing && (
                                    <p className="text-xs text-muted-foreground">
                                        Modal tetap terikat pada unit ini agar
                                        riwayat keuangan tidak berpindah.
                                    </p>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="capital-date">
                                    Tanggal pencatatan
                                </Label>
                                <Input
                                    id="capital-date"
                                    name="purchase_date"
                                    type="date"
                                    value={purchaseDate}
                                    onChange={(event) =>
                                        setPurchaseDate(event.target.value)
                                    }
                                    required
                                    aria-invalid={Boolean(errors.purchase_date)}
                                    className={validationColorClassName}
                                />
                                <InputError
                                    message={errors.purchase_date}
                                    className={errorTextClassName}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="capital-status">
                                    Status modal
                                </Label>
                                <Select
                                    value={status}
                                    onValueChange={(value) =>
                                        setStatus(value as PurchaseStatus)
                                    }
                                >
                                    <SelectTrigger id="capital-status">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="draft">
                                            Draft
                                        </SelectItem>
                                        <SelectItem value="completed">
                                            Aktif
                                        </SelectItem>
                                        <SelectItem value="cancelled">
                                            Dibatalkan
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError
                                    message={errors.status}
                                    className={errorTextClassName}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Rincian modal</CardTitle>
                            <CardDescription>
                                Masukkan seluruh biaya yang membentuk modal unit
                                sebelum dijual.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-5 sm:grid-cols-2">
                            <div className="grid gap-2 sm:col-span-2">
                                <Label htmlFor="capital-price">
                                    Harga perolehan mobil
                                </Label>
                                <PriceInput
                                    id="capital-price"
                                    name="price"
                                    value={price}
                                    onValueChange={setPrice}
                                    placeholder="Contoh: 250.000.000"
                                    required
                                    aria-invalid={Boolean(errors.price)}
                                    className={validationColorClassName}
                                />
                                <InputError
                                    message={errors.price}
                                    className={errorTextClassName}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="capital-repair">
                                    Biaya perbaikan / rekondisi
                                </Label>
                                <PriceInput
                                    id="capital-repair"
                                    name="repair_cost"
                                    value={repairCost}
                                    onValueChange={setRepairCost}
                                    aria-invalid={Boolean(errors.repair_cost)}
                                    className={validationColorClassName}
                                />
                                <InputError
                                    message={errors.repair_cost}
                                    className={errorTextClassName}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="capital-transport">
                                    Biaya transportasi
                                </Label>
                                <PriceInput
                                    id="capital-transport"
                                    name="transport_cost"
                                    value={transportCost}
                                    onValueChange={setTransportCost}
                                    aria-invalid={Boolean(
                                        errors.transport_cost,
                                    )}
                                    className={validationColorClassName}
                                />
                                <InputError
                                    message={errors.transport_cost}
                                    className={errorTextClassName}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="capital-other">
                                    Biaya lainnya
                                </Label>
                                <PriceInput
                                    id="capital-other"
                                    name="other_cost"
                                    value={otherCost}
                                    onValueChange={setOtherCost}
                                    aria-invalid={Boolean(errors.other_cost)}
                                    className={validationColorClassName}
                                />
                                <InputError
                                    message={errors.other_cost}
                                    className={errorTextClassName}
                                />
                            </div>

                            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 sm:col-span-2">
                                <div className="flex items-start gap-3">
                                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                                        <CalculatorIcon className="size-5" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-muted-foreground">
                                            Total modal kendaraan
                                        </div>
                                        <div className="mt-0.5 text-2xl font-bold text-primary tabular-nums">
                                            {currencyFormatter.format(
                                                totalCapital,
                                            )}
                                        </div>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            Nilai ini otomatis menjadi harga
                                            modal pada data mobil saat statusnya
                                            Aktif.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Catatan</CardTitle>
                            <CardDescription>
                                Informasi tambahan mengenai rincian modal.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                id="capital-notes"
                                name="notes"
                                value={notes}
                                onChange={(event) =>
                                    setNotes(event.target.value)
                                }
                                placeholder="Contoh: perbaikan mesin, penggantian ban, atau biaya inspeksi."
                                rows={4}
                                maxLength={2000}
                                aria-invalid={Boolean(errors.notes)}
                                className={validationColorClassName}
                            />
                            <InputError
                                message={errors.notes}
                                className={errorTextClassName}
                            />
                        </CardContent>
                    </Card>

                    <div className="sticky bottom-0 z-10 flex flex-col-reverse gap-3 border-t bg-background/95 py-4 backdrop-blur sm:flex-row sm:justify-end">
                        <Button variant="outline" asChild>
                            <Link href={purchasesIndex()}>Batal</Link>
                        </Button>
                        <Button type="submit" disabled={processing || !hasCars}>
                            {processing ? <Spinner /> : <FloppyDiskIcon />}
                            {isEditing ? 'Simpan perubahan' : 'Tambah modal'}
                        </Button>
                    </div>
                </>
            )}
        </Form>
    );
}

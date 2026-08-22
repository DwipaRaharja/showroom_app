import { Form, Link } from '@inertiajs/react';
import { FloppyDiskIcon, WarningCircleIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import CarController from '@/actions/App/Http/Controllers/CarController';
import InputError from '@/components/input-error';
import { MileageInput } from '@/components/mileage-input';
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
import type { Brand } from '@/pages/brands/types';
import type {
    Car,
    CarStatus,
    FuelType,
    Transmission,
} from '@/pages/cars/types';
import { index as brandsIndex } from '@/routes/brands';
import { index as carsIndex } from '@/routes/cars';

type Props = {
    car: Car | null;
    brands: Pick<Brand, 'id' | 'name'>[];
};

const validationColorClassName =
    'aria-invalid:border-red-500 aria-invalid:ring-red-500/20 dark:aria-invalid:ring-red-500/40';
const errorTextClassName = 'text-red-500 dark:text-red-500';

export function CarForm({ car, brands }: Props) {
    const isEditing = car !== null;
    const [brandId, setBrandId] = useState(
        car?.brand_id
            ? String(car.brand_id)
            : brands[0]?.id
              ? String(brands[0].id)
              : '',
    );
    const [name, setName] = useState(car?.name ?? '');
    const initialPlateParts = (car?.license_plate ?? '').trim().split(/\s+/);
    const [platePrefix, setPlatePrefix] = useState(initialPlateParts[0] ?? '');
    const [plateNumber, setPlateNumber] = useState(initialPlateParts[1] ?? '');
    const [plateSuffix, setPlateSuffix] = useState(initialPlateParts[2] ?? '');
    const [chassisNumber, setChassisNumber] = useState(
        car?.chassis_number ?? '',
    );
    const [engineNumber, setEngineNumber] = useState(car?.engine_number ?? '');
    const [year, setYear] = useState(
        car?.year ? String(car.year) : String(new Date().getFullYear()),
    );
    const [color, setColor] = useState(car?.color ?? '');
    const [transmission, setTransmission] = useState<Transmission>(
        car?.transmission ?? 'automatic',
    );
    const [fuelType, setFuelType] = useState<FuelType>(
        car?.fuel_type ?? 'bensin',
    );
    const [mileage, setMileage] = useState(car ? String(car.mileage) : '0');
    const [purchasePrice, setPurchasePrice] = useState(
        car?.purchase_price !== null && car?.purchase_price !== undefined
            ? String(car.purchase_price)
            : '',
    );
    const [sellingPrice, setSellingPrice] = useState(
        car ? String(car.selling_price) : '',
    );
    const [status, setStatus] = useState<CarStatus>(car?.status ?? 'available');
    const [description, setDescription] = useState(car?.description ?? '');

    const formDefinition = isEditing
        ? CarController.update.form(car.id)
        : CarController.store.form();
    const hasBrands = brands.length > 0;

    return (
        <Form
            {...formDefinition}
            options={{ preserveScroll: true }}
            className="space-y-6"
        >
            {({ processing, errors }) => (
                <>
                    <input type="hidden" name="brand_id" value={brandId} />
                    <input
                        type="hidden"
                        name="transmission"
                        value={transmission}
                    />
                    <input type="hidden" name="fuel_type" value={fuelType} />
                    <input type="hidden" name="status" value={status} />

                    {!hasBrands && (
                        <Alert variant="destructive">
                            <WarningCircleIcon />
                            <AlertTitle>Belum ada merek aktif</AlertTitle>
                            <AlertDescription>
                                Tambahkan atau aktifkan merek terlebih dahulu
                                sebelum membuat unit mobil.{' '}
                                <Link
                                    href={brandsIndex()}
                                    className="font-medium underline underline-offset-4"
                                >
                                    Buka data merek
                                </Link>
                            </AlertDescription>
                        </Alert>
                    )}

                    <Card>
                        <CardHeader>
                            <CardTitle>Identitas kendaraan</CardTitle>
                            <CardDescription>
                                Informasi utama untuk mengenali unit mobil di
                                showroom.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-5 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="car-brand">
                                    Merek kendaraan
                                </Label>
                                <Select
                                    value={brandId}
                                    onValueChange={setBrandId}
                                    disabled={!hasBrands}
                                >
                                    <SelectTrigger
                                        id="car-brand"
                                        aria-invalid={Boolean(errors.brand_id)}
                                        className={validationColorClassName}
                                    >
                                        <SelectValue placeholder="Pilih merek" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {brands.map((brand) => (
                                            <SelectItem
                                                key={brand.id}
                                                value={String(brand.id)}
                                            >
                                                {brand.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError
                                    message={errors.brand_id}
                                    className={errorTextClassName}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="car-name">
                                    Nama / varian model
                                </Label>
                                <Input
                                    id="car-name"
                                    name="name"
                                    value={name}
                                    onChange={(event) =>
                                        setName(event.target.value)
                                    }
                                    placeholder="Contoh: Avanza 1.3 G M/T"
                                    maxLength={255}
                                    required
                                    autoFocus
                                    aria-invalid={Boolean(errors.name)}
                                    className={validationColorClassName}
                                />
                                <InputError
                                    message={errors.name}
                                    className={errorTextClassName}
                                />
                            </div>

                            <div className="grid gap-2 sm:col-span-2">
                                <Label>Plat nomor kendaraan</Label>
                                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                                    <div className="space-y-1">
                                        <Input
                                            id="car-plate-prefix"
                                            name="plate_prefix"
                                            value={platePrefix}
                                            onChange={(event) =>
                                                setPlatePrefix(
                                                    event.target.value
                                                        .replace(/[^a-zA-Z]/g, '')
                                                        .toUpperCase(),
                                                )
                                            }
                                            placeholder="B / DK"
                                            maxLength={2}
                                            className={`text-center font-mono font-bold tracking-wider ${validationColorClassName}`}
                                            aria-invalid={Boolean(
                                                errors.license_plate,
                                            )}
                                        />
                                        <span className="block text-center text-[11px] text-muted-foreground">
                                            Wilayah (B)
                                        </span>
                                    </div>

                                    <div className="space-y-1 sm:col-span-2">
                                        <Input
                                            id="car-plate-number"
                                            name="plate_number"
                                            value={plateNumber}
                                            onChange={(event) =>
                                                setPlateNumber(
                                                    event.target.value.replace(
                                                        /[^0-9]/g,
                                                        '',
                                                    ),
                                                )
                                            }
                                            placeholder="1234"
                                            maxLength={4}
                                            inputMode="numeric"
                                            className={`text-center font-mono font-bold tracking-wider ${validationColorClassName}`}
                                            aria-invalid={Boolean(
                                                errors.license_plate,
                                            )}
                                        />
                                        <span className="block text-center text-[11px] text-muted-foreground">
                                            Nomor Polisi (Angka)
                                        </span>
                                    </div>

                                    <div className="space-y-1">
                                        <Input
                                            id="car-plate-suffix"
                                            name="plate_suffix"
                                            value={plateSuffix}
                                            onChange={(event) =>
                                                setPlateSuffix(
                                                    event.target.value
                                                        .replace(/[^a-zA-Z]/g, '')
                                                        .toUpperCase(),
                                                )
                                            }
                                            placeholder="ABC"
                                            maxLength={3}
                                            className={`text-center font-mono font-bold tracking-wider ${validationColorClassName}`}
                                            aria-invalid={Boolean(
                                                errors.license_plate,
                                            )}
                                        />
                                        <span className="block text-center text-[11px] text-muted-foreground">
                                            Seri (ABC)
                                        </span>
                                    </div>
                                </div>
                                <InputError
                                    message={errors.license_plate}
                                    className={errorTextClassName}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="car-chassis">
                                    Nomor rangka (VIN)
                                </Label>
                                <Input
                                    id="car-chassis"
                                    name="chassis_number"
                                    value={chassisNumber}
                                    onChange={(event) =>
                                        setChassisNumber(
                                            event.target.value.toUpperCase(),
                                        )
                                    }
                                    placeholder="Contoh: MHF11234567890123"
                                    maxLength={50}
                                    aria-invalid={Boolean(errors.chassis_number)}
                                    className={validationColorClassName}
                                />
                                <InputError
                                    message={errors.chassis_number}
                                    className={errorTextClassName}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="car-engine">Nomor mesin</Label>
                                <Input
                                    id="car-engine"
                                    name="engine_number"
                                    value={engineNumber}
                                    onChange={(event) =>
                                        setEngineNumber(
                                            event.target.value.toUpperCase(),
                                        )
                                    }
                                    placeholder="Contoh: 2NR-1234567"
                                    maxLength={50}
                                    aria-invalid={Boolean(errors.engine_number)}
                                    className={validationColorClassName}
                                />
                                <InputError
                                    message={errors.engine_number}
                                    className={errorTextClassName}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="car-year">
                                    Tahun pembuatan
                                </Label>
                                <Input
                                    id="car-year"
                                    name="year"
                                    type="number"
                                    min={1990}
                                    max={new Date().getFullYear() + 1}
                                    value={year}
                                    onChange={(event) =>
                                        setYear(event.target.value)
                                    }
                                    required
                                    aria-invalid={Boolean(errors.year)}
                                    className={validationColorClassName}
                                />
                                <InputError
                                    message={errors.year}
                                    className={errorTextClassName}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="car-color">
                                    Warna kendaraan
                                </Label>
                                <Input
                                    id="car-color"
                                    name="color"
                                    value={color}
                                    onChange={(event) =>
                                        setColor(event.target.value)
                                    }
                                    placeholder="Contoh: Putih Mutiara"
                                    maxLength={50}
                                    aria-invalid={Boolean(errors.color)}
                                    className={validationColorClassName}
                                />
                                <InputError
                                    message={errors.color}
                                    className={errorTextClassName}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="car-mileage">
                                    Jarak tempuh (km)
                                </Label>
                                <MileageInput
                                    id="car-mileage"
                                    name="mileage"
                                    value={mileage}
                                    onValueChange={setMileage}
                                    placeholder="Contoh: 45.000"
                                    required
                                    aria-invalid={Boolean(errors.mileage)}
                                    className={validationColorClassName}
                                />
                                <InputError
                                    message={errors.mileage}
                                    className={errorTextClassName}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Spesifikasi</CardTitle>
                            <CardDescription>
                                Konfigurasi mesin dan transmisi kendaraan.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-5 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="car-transmission">
                                    Transmisi
                                </Label>
                                <Select
                                    value={transmission}
                                    onValueChange={(value) =>
                                        setTransmission(value as Transmission)
                                    }
                                >
                                    <SelectTrigger id="car-transmission">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="automatic">
                                            Otomatis (A/T)
                                        </SelectItem>
                                        <SelectItem value="manual">
                                            Manual (M/T)
                                        </SelectItem>
                                        <SelectItem value="cvt">CVT</SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError
                                    message={errors.transmission}
                                    className={errorTextClassName}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="car-fuel">Bahan bakar</Label>
                                <Select
                                    value={fuelType}
                                    onValueChange={(value) =>
                                        setFuelType(value as FuelType)
                                    }
                                >
                                    <SelectTrigger id="car-fuel">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="bensin">
                                            Bensin
                                        </SelectItem>
                                        <SelectItem value="diesel">
                                            Diesel
                                        </SelectItem>
                                        <SelectItem value="hybrid">
                                            Hybrid
                                        </SelectItem>
                                        <SelectItem value="electric">
                                            Listrik (EV)
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError
                                    message={errors.fuel_type}
                                    className={errorTextClassName}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Harga</CardTitle>
                            <CardDescription>
                                Nilai modal dan harga penawaran unit mobil.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-5 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="car-purchase-price">
                                    Harga beli / modal (Rp)
                                </Label>
                                <PriceInput
                                    id="car-purchase-price"
                                    name="purchase_price"
                                    value={purchasePrice}
                                    onValueChange={setPurchasePrice}
                                    placeholder="Contoh: 180.000.000"
                                    aria-invalid={Boolean(
                                        errors.purchase_price,
                                    )}
                                    className={validationColorClassName}
                                />
                                <InputError
                                    message={errors.purchase_price}
                                    className={errorTextClassName}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="car-selling-price">
                                    Harga jual (Rp)
                                </Label>
                                <PriceInput
                                    id="car-selling-price"
                                    name="selling_price"
                                    value={sellingPrice}
                                    onValueChange={setSellingPrice}
                                    placeholder="Contoh: 215.000.000"
                                    required
                                    aria-invalid={Boolean(errors.selling_price)}
                                    className={validationColorClassName}
                                />
                                <InputError
                                    message={errors.selling_price}
                                    className={errorTextClassName}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Status dan kondisi</CardTitle>
                            <CardDescription>
                                Status inventaris serta catatan kondisi unit.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-5">
                            <div className="grid gap-2">
                                <Label htmlFor="car-status">Status unit</Label>
                                <Select
                                    value={status}
                                    onValueChange={(value) =>
                                        setStatus(value as CarStatus)
                                    }
                                >
                                    <SelectTrigger
                                        id="car-status"
                                        className="sm:max-w-sm"
                                    >
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="available">
                                            Tersedia
                                        </SelectItem>
                                        <SelectItem value="booked">
                                            Dibooking
                                        </SelectItem>
                                        <SelectItem value="sold">
                                            Terjual
                                        </SelectItem>
                                        <SelectItem value="maintenance">
                                            Dalam perbaikan / servis
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError
                                    message={errors.status}
                                    className={errorTextClassName}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="car-description">
                                    Catatan kondisi / deskripsi
                                </Label>
                                <Textarea
                                    id="car-description"
                                    name="description"
                                    value={description}
                                    onChange={(event) =>
                                        setDescription(event.target.value)
                                    }
                                    placeholder="Catatan kilometer asli, tangan pertama, riwayat servis, dan kondisi kendaraan."
                                    rows={5}
                                    aria-invalid={Boolean(errors.description)}
                                    className={validationColorClassName}
                                />
                                <InputError
                                    message={errors.description}
                                    className={errorTextClassName}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <div className="sticky bottom-0 z-10 flex flex-col-reverse gap-3 border-t bg-background/95 py-4 backdrop-blur sm:flex-row sm:justify-end">
                        <Button variant="outline" asChild>
                            <Link href={carsIndex()}>Batal</Link>
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing || !hasBrands}
                        >
                            {processing ? <Spinner /> : <FloppyDiskIcon />}
                            {isEditing
                                ? 'Simpan perubahan'
                                : 'Tambah unit mobil'}
                        </Button>
                    </div>
                </>
            )}
        </Form>
    );
}

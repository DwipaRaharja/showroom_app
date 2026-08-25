import { Form, Link } from '@inertiajs/react';
import {
    CalculatorIcon,
    CameraIcon,
    FloppyDiskIcon,
    TrashIcon,
    WarningCircleIcon,
    XIcon,
} from '@phosphor-icons/react';
import { useEffect, useMemo, useState } from 'react';
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
    CarCapitalStatus,
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
    const [capitalDate, setCapitalDate] = useState(
        car?.capital?.purchase_date?.slice(0, 10) ?? today(),
    );
    const [capitalPrice, setCapitalPrice] = useState(
        car?.capital ? String(car.capital.price) : '',
    );
    const [repairCost, setRepairCost] = useState(
        String(car?.capital?.repair_cost ?? 0),
    );
    const [transportCost, setTransportCost] = useState(
        String(car?.capital?.transport_cost ?? 0),
    );
    const [otherCost, setOtherCost] = useState(
        String(car?.capital?.other_cost ?? 0),
    );
    const documentProcessCost = car?.capital?.document_process_cost ?? 0;
    const [capitalStatus, setCapitalStatus] = useState<CarCapitalStatus>(
        car?.capital?.status ?? 'completed',
    );
    const [capitalNotes, setCapitalNotes] = useState(car?.capital?.notes ?? '');
    const [sellingPrice, setSellingPrice] = useState(
        car ? String(car.selling_price) : '',
    );
    const [status, setStatus] = useState<CarStatus>(car?.status ?? 'available');
    const [description, setDescription] = useState(car?.description ?? '');
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [removeImage, setRemoveImage] = useState(false);
    const [imageInputKey, setImageInputKey] = useState(0);
    const selectedImagePreview = useMemo(
        () =>
            selectedImage === null ? null : URL.createObjectURL(selectedImage),
        [selectedImage],
    );
    const storedImagePreview =
        car?.image && !removeImage
            ? CarController.image.url(car.id, {
                  query: { v: car.updated_at },
              })
            : null;
    const imagePreview = selectedImagePreview ?? storedImagePreview;
    const totalCapital = useMemo(
        () =>
            numericValue(capitalPrice) +
            numericValue(repairCost) +
            numericValue(transportCost) +
            numericValue(otherCost) +
            documentProcessCost,
        [
            capitalPrice,
            repairCost,
            transportCost,
            otherCost,
            documentProcessCost,
        ],
    );

    const formDefinition = isEditing
        ? CarController.update.form(car.id)
        : CarController.store.form();
    const hasBrands = brands.length > 0;

    useEffect(
        () => () => {
            if (selectedImagePreview !== null) {
                URL.revokeObjectURL(selectedImagePreview);
            }
        },
        [selectedImagePreview],
    );

    function clearSelectedImage() {
        setSelectedImage(null);
        setImageInputKey((current) => current + 1);
    }

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
                    <input
                        type="hidden"
                        name="capital[status]"
                        value={capitalStatus}
                    />
                    {isEditing && (
                        <input
                            type="hidden"
                            name="remove_image"
                            value={removeImage ? '1' : '0'}
                        />
                    )}

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
                                    Merek kendaraan{' '}
                                    <span className="text-red-500">*</span>
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
                                    Nama / varian model{' '}
                                    <span className="text-red-500">*</span>
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
                                                        .replace(
                                                            /[^a-zA-Z]/g,
                                                            '',
                                                        )
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
                                                        .replace(
                                                            /[^a-zA-Z]/g,
                                                            '',
                                                        )
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
                                    aria-invalid={Boolean(
                                        errors.chassis_number,
                                    )}
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
                                    Tahun pembuatan{' '}
                                    <span className="text-red-500">*</span>
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
                                    Jarak tempuh (km){' '}
                                    <span className="text-red-500">*</span>
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
                            <CardTitle>Gambar kendaraan</CardTitle>
                            <CardDescription>
                                Tambahkan satu gambar utama untuk memudahkan
                                identifikasi unit mobil.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
                            <div className="overflow-hidden rounded-xl border bg-muted/40">
                                {imagePreview ? (
                                    <img
                                        src={imagePreview}
                                        alt={`Preview ${name || 'kendaraan'}`}
                                        className="aspect-video size-full object-cover"
                                    />
                                ) : (
                                    <div className="flex aspect-video items-center justify-center">
                                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                            <CameraIcon className="size-10" />
                                            <span className="text-sm">
                                                Belum ada gambar kendaraan
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col justify-center gap-3">
                                <div className="grid gap-2">
                                    <Label htmlFor="car-image">
                                        Pilih gambar utama
                                    </Label>
                                    <Input
                                        key={imageInputKey}
                                        id="car-image"
                                        name="image"
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        onChange={(event) => {
                                            const image =
                                                event.target.files?.[0] ?? null;

                                            setSelectedImage(image);

                                            if (image !== null) {
                                                setRemoveImage(false);
                                            }
                                        }}
                                        aria-invalid={Boolean(errors.image)}
                                        className={validationColorClassName}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        JPG, PNG, atau WebP. Maksimal 5 MB.
                                    </p>
                                    <InputError
                                        message={errors.image}
                                        className={errorTextClassName}
                                    />
                                </div>

                                {selectedImage && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-fit"
                                        onClick={clearSelectedImage}
                                    >
                                        <XIcon />
                                        Batalkan gambar pilihan
                                    </Button>
                                )}

                                {isEditing && car.image && !selectedImage && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className={
                                            removeImage
                                                ? 'w-fit'
                                                : 'w-fit text-red-500 hover:text-red-500'
                                        }
                                        onClick={() =>
                                            setRemoveImage(
                                                (current) => !current,
                                            )
                                        }
                                    >
                                        {removeImage ? (
                                            <XIcon />
                                        ) : (
                                            <TrashIcon className="text-red-500" />
                                        )}
                                        {removeImage
                                            ? 'Batalkan hapus gambar'
                                            : 'Hapus gambar saat disimpan'}
                                    </Button>
                                )}
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
                                    Transmisi{' '}
                                    <span className="text-red-500">*</span>
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
                                <Label htmlFor="car-fuel">
                                    Bahan bakar{' '}
                                    <span className="text-red-500">*</span>
                                </Label>
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
                            <CardTitle>Modal awal dan harga jual</CardTitle>
                            <CardDescription>
                                Modal tersimpan langsung sebagai bagian dari
                                unit mobil dan menjadi sumber perhitungan
                                keuntungan.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-5 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="car-capital-date">
                                    Tanggal perolehan{' '}
                                    <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="car-capital-date"
                                    name="capital[purchase_date]"
                                    type="date"
                                    value={capitalDate}
                                    onChange={(event) =>
                                        setCapitalDate(event.target.value)
                                    }
                                    required
                                    aria-invalid={Boolean(
                                        errors['capital.purchase_date'],
                                    )}
                                    className={validationColorClassName}
                                />
                                <InputError
                                    message={errors['capital.purchase_date']}
                                    className={errorTextClassName}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="car-capital-status">
                                    Status modal{' '}
                                    <span className="text-red-500">*</span>
                                </Label>
                                <Select
                                    value={capitalStatus}
                                    onValueChange={(value) =>
                                        setCapitalStatus(
                                            value as CarCapitalStatus,
                                        )
                                    }
                                >
                                    <SelectTrigger id="car-capital-status">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="completed">
                                            Aktif
                                        </SelectItem>
                                        <SelectItem value="draft">
                                            Draft
                                        </SelectItem>
                                        <SelectItem value="cancelled">
                                            Dibatalkan
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError
                                    message={errors['capital.status']}
                                    className={errorTextClassName}
                                />
                            </div>

                            <div className="grid gap-2 sm:col-span-2">
                                <Label htmlFor="car-capital-price">
                                    Harga perolehan mobil{' '}
                                    <span className="text-red-500">*</span>
                                </Label>
                                <PriceInput
                                    id="car-capital-price"
                                    name="capital[price]"
                                    value={capitalPrice}
                                    onValueChange={setCapitalPrice}
                                    placeholder="Contoh: 180.000.000"
                                    required
                                    aria-invalid={Boolean(
                                        errors['capital.price'],
                                    )}
                                    className={validationColorClassName}
                                />
                                <InputError
                                    message={errors['capital.price']}
                                    className={errorTextClassName}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="car-repair-cost">
                                    Biaya perbaikan / rekondisi
                                </Label>
                                <PriceInput
                                    id="car-repair-cost"
                                    name="capital[repair_cost]"
                                    value={repairCost}
                                    onValueChange={setRepairCost}
                                    aria-invalid={Boolean(
                                        errors['capital.repair_cost'],
                                    )}
                                    className={validationColorClassName}
                                />
                                <InputError
                                    message={errors['capital.repair_cost']}
                                    className={errorTextClassName}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="car-transport-cost">
                                    Biaya transportasi
                                </Label>
                                <PriceInput
                                    id="car-transport-cost"
                                    name="capital[transport_cost]"
                                    value={transportCost}
                                    onValueChange={setTransportCost}
                                    aria-invalid={Boolean(
                                        errors['capital.transport_cost'],
                                    )}
                                    className={validationColorClassName}
                                />
                                <InputError
                                    message={errors['capital.transport_cost']}
                                    className={errorTextClassName}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="car-other-cost">
                                    Biaya lainnya
                                </Label>
                                <PriceInput
                                    id="car-other-cost"
                                    name="capital[other_cost]"
                                    value={otherCost}
                                    onValueChange={setOtherCost}
                                    aria-invalid={Boolean(
                                        errors['capital.other_cost'],
                                    )}
                                    className={validationColorClassName}
                                />
                                <InputError
                                    message={errors['capital.other_cost']}
                                    className={errorTextClassName}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="car-selling-price">
                                    Harga jual (Rp){' '}
                                    <span className="text-red-500">*</span>
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

                            <div className="grid gap-2">
                                <Label>Biaya proses berkas (otomatis)</Label>
                                <PriceInput
                                    name="capital.document_process_cost"
                                    value={String(documentProcessCost)}
                                    onValueChange={() => undefined}
                                    disabled
                                />
                                <p className="text-xs text-muted-foreground">
                                    Berasal dari biaya proses yang dibayar
                                    showroom dan tidak dapat diedit manual.
                                </p>
                            </div>

                            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 sm:col-span-2">
                                <div className="flex items-start gap-3">
                                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
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
                                            Penjualan hanya dapat dibuat ketika
                                            status modal Aktif.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-2 sm:col-span-2">
                                <Label htmlFor="car-capital-notes">
                                    Catatan modal
                                </Label>
                                <Textarea
                                    id="car-capital-notes"
                                    name="capital[notes]"
                                    value={capitalNotes}
                                    onChange={(event) =>
                                        setCapitalNotes(event.target.value)
                                    }
                                    placeholder="Catatan mengenai harga perolehan atau biaya persiapan unit."
                                    rows={3}
                                    aria-invalid={Boolean(
                                        errors['capital.notes'],
                                    )}
                                    className={validationColorClassName}
                                />
                                <InputError
                                    message={errors['capital.notes']}
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
                                <Label htmlFor="car-status">
                                    Status unit{' '}
                                    <span className="text-red-500">*</span>
                                </Label>
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

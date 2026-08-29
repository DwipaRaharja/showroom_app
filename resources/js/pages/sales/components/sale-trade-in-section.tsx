import { CarProfileIcon } from '@phosphor-icons/react';
import { FormGroup, inputValidationClass } from '@/components/form-group';
import InputError from '@/components/input-error';
import { LicensePlateInput } from '@/components/license-plate-input';
import { MileageInput } from '@/components/mileage-input';
import { PriceInput } from '@/components/price-input';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export function SaleTradeInSection({
    tradeInBrand,
    setTradeInBrand,
    tradeInCarName,
    setTradeInCarName,
    tradeInLicensePlate,
    setTradeInLicensePlate,
    tradeInYear,
    setTradeInYear,
    tradeInColor,
    setTradeInColor,
    tradeInMileage,
    setTradeInMileage,
    tradeInPrice,
    setTradeInPrice,
    downPayment,
    setDownPayment,
    tradeInNotes,
    setTradeInNotes,
    errors,
    brands,
    validationColorClassName,
    errorTextClassName,
}: any) {
    return (
        <div className="space-y-4 rounded-xl border border-purple-500/30 bg-purple-500/5 p-4 sm:p-5 dark:bg-purple-500/10">
            <div className="flex items-center gap-2 border-b border-purple-500/20 pb-3">
                <div className="flex size-7 items-center justify-center rounded-md bg-purple-600 text-white shadow-xs">
                    <CarProfileIcon className="size-4" weight="bold" />
                </div>
                <div>
                    <h4 className="text-sm font-semibold text-foreground">
                        Data Mobil Tukar Tambah
                    </h4>
                    <p className="text-xs text-muted-foreground">
                        Masukkan rincian unit kendaraan milik customer yang
                        ditukarkan.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                    <Label htmlFor="trade_in_brand">
                        Merek Mobil <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="trade_in_brand"
                        name="trade_in_brand"
                        list="trade_in_brands_list"
                        placeholder="Pilih / ketik merek (Toyota, Honda, dll)"
                        value={tradeInBrand}
                        onChange={(e) => setTradeInBrand(e.target.value)}
                        required
                        autoComplete="off"
                        aria-invalid={Boolean(errors.trade_in_brand)}
                        className={validationColorClassName}
                    />
                    {brands?.length > 0 && (
                        <datalist id="trade_in_brands_list">
                            {brands.map((b: any) => (
                                <option key={b.id} value={b.name} />
                            ))}
                        </datalist>
                    )}
                    <InputError
                        message={errors.trade_in_brand}
                        className={errorTextClassName}
                    />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="trade_in_car_name">
                        Nama Unit / Tipe Model{' '}
                        <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="trade_in_car_name"
                        name="trade_in_car_name"
                        placeholder="misal: Avanza 1.3 G M/T"
                        value={tradeInCarName}
                        onChange={(e) => setTradeInCarName(e.target.value)}
                        required
                        aria-invalid={Boolean(errors.trade_in_car_name)}
                        className={validationColorClassName}
                    />
                    <InputError
                        message={errors.trade_in_car_name}
                        className={errorTextClassName}
                    />
                </div>

                <FormGroup
                    label="Plat Nomor Kendaraan"
                    required
                    error={errors.trade_in_license_plate}
                >
                    <LicensePlateInput
                        name="trade_in_license_plate"
                        value={tradeInLicensePlate}
                        onChange={setTradeInLicensePlate}
                        required
                        aria-invalid={Boolean(errors.trade_in_license_plate)}
                        className={
                            errors.trade_in_license_plate
                                ? inputValidationClass
                                : ''
                        }
                    />
                </FormGroup>

                <div className="grid gap-2">
                    <Label htmlFor="trade_in_year">
                        Tahun Pembuatan <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="trade_in_year"
                        name="trade_in_year"
                        type="number"
                        min={1900}
                        max={new Date().getFullYear() + 1}
                        placeholder="2020"
                        value={tradeInYear}
                        onChange={(e) => setTradeInYear(e.target.value)}
                        required
                        aria-invalid={Boolean(errors.trade_in_year)}
                        className={validationColorClassName}
                    />
                    <InputError
                        message={errors.trade_in_year}
                        className={errorTextClassName}
                    />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="trade_in_color">
                        Warna Mobil <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="trade_in_color"
                        name="trade_in_color"
                        placeholder="misal: Hitam Metalik, Putih"
                        value={tradeInColor}
                        onChange={(e) => setTradeInColor(e.target.value)}
                        required
                        aria-invalid={Boolean(errors.trade_in_color)}
                        className={validationColorClassName}
                    />
                    <InputError
                        message={errors.trade_in_color}
                        className={errorTextClassName}
                    />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="trade_in_mileage">Kilometer (Odo)</Label>
                    <MileageInput
                        id="trade_in_mileage"
                        name="trade_in_mileage"
                        value={tradeInMileage}
                        onValueChange={setTradeInMileage}
                        placeholder="0"
                        aria-invalid={Boolean(errors.trade_in_mileage)}
                        className={validationColorClassName}
                    />
                    <InputError
                        message={errors.trade_in_mileage}
                        className={errorTextClassName}
                    />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="trade_in_price">
                        Nilai / Harga Mobil Tukar Tambah{' '}
                        <span className="text-red-500">*</span>
                    </Label>
                    <PriceInput
                        id="trade_in_price"
                        name="trade_in_price"
                        value={tradeInPrice}
                        onValueChange={setTradeInPrice}
                        placeholder="0"
                        required
                        aria-invalid={Boolean(errors.trade_in_price)}
                        className={validationColorClassName}
                    />
                    <InputError
                        message={errors.trade_in_price}
                        className={errorTextClassName}
                    />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="down_payment">
                        Tambahan Uang / DP Kas (Opsional)
                    </Label>
                    <PriceInput
                        id="down_payment"
                        name="down_payment"
                        value={downPayment}
                        onValueChange={setDownPayment}
                        placeholder="0"
                        aria-invalid={Boolean(errors.down_payment)}
                        className={validationColorClassName}
                    />
                    <InputError
                        message={errors.down_payment}
                        className={errorTextClassName}
                    />
                </div>

                <div className="grid gap-2 sm:col-span-2">
                    <Label htmlFor="trade_in_notes">Catatan Kondisi Unit</Label>
                    <Textarea
                        id="trade_in_notes"
                        name="trade_in_notes"
                        placeholder="misal: Pajak mati 2 tahun, lecet bumper depan..."
                        value={tradeInNotes}
                        onChange={(e) => setTradeInNotes(e.target.value)}
                        aria-invalid={Boolean(errors.trade_in_notes)}
                        className={`min-h-[80px] resize-y ${validationColorClassName}`}
                    />
                    <InputError
                        message={errors.trade_in_notes}
                        className={errorTextClassName}
                    />
                </div>
            </div>
        </div>
    );
}

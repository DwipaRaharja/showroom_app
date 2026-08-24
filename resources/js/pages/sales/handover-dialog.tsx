import { Form } from '@inertiajs/react';
import {
    CarProfileIcon,
    CheckCircleIcon,
    FileArrowDownIcon,
    FloppyDiskIcon,
    KeyIcon,
    LockKeyIcon,
    MapPinIcon,
    ShieldCheckIcon,
    UploadSimpleIcon,
    UserIcon,
} from '@phosphor-icons/react';
import { useState } from 'react';
import VehicleHandoverController from '@/actions/App/Http/Controllers/VehicleHandoverController';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Textarea } from '@/components/ui/textarea';
import type {
    HandoverChecklist,
    RecipientRelation,
    Sale,
} from '@/pages/sales/types';

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    sale: Sale;
};

const currencyFormatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
});

const invalidClassName =
    'aria-invalid:border-red-500 aria-invalid:ring-red-500/20 dark:aria-invalid:ring-red-500/40';
const errorClassName = 'mt-1 text-xs text-red-500';

function nowForInput(): string {
    const date = new Date();
    const localDate = new Date(
        date.getTime() - date.getTimezoneOffset() * 60_000,
    );

    return localDate.toISOString().slice(0, 16);
}

function formatDateTimeLocal(value?: string | null): string {
    if (!value) {
        return '';
    }

    const date = new Date(value);
    const localDate = new Date(
        date.getTime() - date.getTimezoneOffset() * 60_000,
    );

    return localDate.toISOString().slice(0, 16);
}

export function HandoverDialog({ open, onOpenChange, sale }: Props) {
    const existing = sale.handover;
    const remainingBill = sale.remaining_bill ?? 0;
    const canDeliverVehicle =
        sale.can_deliver_vehicle ?? remainingBill <= 10_000_000;
    const canDeliverBpkb = sale.can_deliver_bpkb ?? remainingBill <= 0;
    const unitAlreadyDelivered = Boolean(existing?.vehicle_delivered_at);
    const bpkbAlreadyDelivered = Boolean(existing?.bpkb_delivered_at);

    const [recordVehicleDelivery, setRecordVehicleDelivery] =
        useState(unitAlreadyDelivered);
    const [recordBpkbDelivery, setRecordBpkbDelivery] =
        useState(bpkbAlreadyDelivered);
    const [vehicleDeliveredAt, setVehicleDeliveredAt] = useState(
        formatDateTimeLocal(existing?.vehicle_delivered_at),
    );
    const [bpkbDeliveredAt, setBpkbDeliveredAt] = useState(
        formatDateTimeLocal(existing?.bpkb_delivered_at),
    );
    const [recipientName, setRecipientName] = useState(
        existing?.recipient_name ?? sale.customer?.name ?? '',
    );
    const [recipientPhone, setRecipientPhone] = useState(
        existing?.recipient_phone ?? sale.customer?.phone ?? '',
    );
    const [recipientIdCard, setRecipientIdCard] = useState(
        existing?.recipient_id_card ?? sale.customer?.ktp_number ?? '',
    );
    const [recipientRelation, setRecipientRelation] =
        useState<RecipientRelation>(
            existing?.recipient_relation ?? 'buyer_self',
        );
    const [officerName, setOfficerName] = useState(
        existing?.officer_name ?? 'Admin Showroom',
    );
    const [handoverLocation, setHandoverLocation] = useState(
        existing?.handover_location ?? 'Showroom Telaga Berlian',
    );
    const [handoverAddress, setHandoverAddress] = useState(
        existing?.handover_address ?? '',
    );
    const [bpkbRecipientType, setBpkbRecipientType] = useState<
        'customer' | 'finance_company'
    >(
        existing?.bpkb_recipient_type ??
            (sale.payment_type === 'credit' ? 'finance_company' : 'customer'),
    );

    const checklist: HandoverChecklist = existing?.checklist ?? {};
    const [keyCount, setKeyCount] = useState(checklist.key_count ?? 2);
    const [hasStnk, setHasStnk] = useState(checklist.has_stnk ?? true);
    const [hasBpkb, setHasBpkb] = useState(checklist.has_bpkb ?? false);
    const [hasFaktur, setHasFaktur] = useState(checklist.has_faktur ?? false);
    const [hasManualBook, setHasManualBook] = useState(
        checklist.has_manual_book ?? true,
    );
    const [hasToolkit, setHasToolkit] = useState(checklist.has_toolkit ?? true);
    const [hasSpareTire, setHasSpareTire] = useState(
        checklist.has_spare_tire ?? true,
    );
    const [fuelLevel, setFuelLevel] = useState(checklist.fuel_level ?? '1/2');
    const [cleanliness, setCleanliness] = useState(
        checklist.cleanliness ?? 'Bersih & Salon Siap Pakai',
    );
    const [notes, setNotes] = useState(existing?.notes ?? '');

    const canSelectBpkb =
        canDeliverBpkb && (recordVehicleDelivery || unitAlreadyDelivered);
    const hasSelectedStage = recordVehicleDelivery || recordBpkbDelivery;

    function toggleVehicleDelivery(checked: boolean) {
        if (unitAlreadyDelivered) {
            return;
        }

        setRecordVehicleDelivery(checked);
        setVehicleDeliveredAt(checked ? nowForInput() : '');

        if (!checked) {
            setRecordBpkbDelivery(false);
            setBpkbDeliveredAt('');
            setHasBpkb(false);
            setHasFaktur(false);
        }
    }

    function toggleBpkbDelivery(checked: boolean) {
        if (bpkbAlreadyDelivered || !canSelectBpkb) {
            return;
        }

        setRecordBpkbDelivery(checked);
        setBpkbDeliveredAt(checked ? nowForInput() : '');
        setHasBpkb(checked);
        setHasFaktur(checked);
    }

    function fillBuyerData() {
        if (!sale.customer) {
            return;
        }

        setRecipientName(sale.customer.name);
        setRecipientPhone(sale.customer.phone ?? '');
        setRecipientIdCard(sale.customer.ktp_number ?? '');
        setRecipientRelation('buyer_self');
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[92vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
                <DialogHeader className="border-b px-5 py-4 pr-12 sm:px-6">
                    <DialogTitle className="flex items-center gap-2">
                        <CarProfileIcon className="size-5 text-primary" />
                        {existing
                            ? 'Perbarui Penyerahan Unit'
                            : 'Catat Penyerahan Unit'}
                    </DialogTitle>
                    <DialogDescription>
                        {sale.invoice_number} · {sale.car?.brand?.name}{' '}
                        {sale.car?.name} ·{' '}
                        {sale.car?.license_plate ?? 'Tanpa plat'}
                    </DialogDescription>
                </DialogHeader>

                <Form
                    action={VehicleHandoverController.store.url()}
                    method="post"
                    options={{ preserveScroll: true }}
                    onSuccess={() => onOpenChange(false)}
                    className="flex min-h-0 flex-1 flex-col overflow-hidden"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
                                <input
                                    type="hidden"
                                    name="sale_id"
                                    value={sale.id}
                                />
                                <input
                                    type="hidden"
                                    name="recipient_relation"
                                    value={recipientRelation}
                                />
                                <input
                                    type="hidden"
                                    name="handover_location"
                                    value={handoverLocation}
                                />
                                {recordVehicleDelivery && (
                                    <input
                                        type="hidden"
                                        name="vehicle_delivered_at"
                                        value={vehicleDeliveredAt}
                                    />
                                )}
                                {recordBpkbDelivery && (
                                    <>
                                        <input
                                            type="hidden"
                                            name="bpkb_delivered_at"
                                            value={bpkbDeliveredAt}
                                        />
                                        <input
                                            type="hidden"
                                            name="bpkb_recipient_type"
                                            value={bpkbRecipientType}
                                        />
                                    </>
                                )}
                                <input
                                    type="hidden"
                                    name="checklist[key_count]"
                                    value={keyCount}
                                />
                                <input
                                    type="hidden"
                                    name="checklist[has_stnk]"
                                    value={hasStnk ? '1' : '0'}
                                />
                                <input
                                    type="hidden"
                                    name="checklist[has_bpkb]"
                                    value={hasBpkb ? '1' : '0'}
                                />
                                <input
                                    type="hidden"
                                    name="checklist[has_faktur]"
                                    value={hasFaktur ? '1' : '0'}
                                />
                                <input
                                    type="hidden"
                                    name="checklist[has_manual_book]"
                                    value={hasManualBook ? '1' : '0'}
                                />
                                <input
                                    type="hidden"
                                    name="checklist[has_toolkit]"
                                    value={hasToolkit ? '1' : '0'}
                                />
                                <input
                                    type="hidden"
                                    name="checklist[has_spare_tire]"
                                    value={hasSpareTire ? '1' : '0'}
                                />
                                <input
                                    type="hidden"
                                    name="checklist[fuel_level]"
                                    value={fuelLevel}
                                />
                                <input
                                    type="hidden"
                                    name="checklist[cleanliness]"
                                    value={cleanliness}
                                />

                                <section className="space-y-3">
                                    <div>
                                        <h3 className="text-sm font-semibold">
                                            Tahap yang dicatat
                                        </h3>
                                        <p className="text-xs text-muted-foreground">
                                            Waktu penyerahan baru diisi setelah
                                            tahap dipilih.
                                        </p>
                                    </div>

                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <label
                                            className={`flex gap-3 rounded-xl border p-4 transition-colors ${
                                                recordVehicleDelivery
                                                    ? 'border-emerald-500/40 bg-emerald-500/5'
                                                    : !canDeliverVehicle
                                                      ? 'cursor-not-allowed bg-muted/40 opacity-70'
                                                      : 'cursor-pointer hover:bg-muted/30'
                                            }`}
                                        >
                                            <Checkbox
                                                checked={recordVehicleDelivery}
                                                disabled={
                                                    unitAlreadyDelivered ||
                                                    !canDeliverVehicle
                                                }
                                                onCheckedChange={(value) =>
                                                    toggleVehicleDelivery(
                                                        value === true,
                                                    )
                                                }
                                                aria-label="Catat penyerahan unit dan STNK"
                                            />
                                            <div className="min-w-0 space-y-1">
                                                <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                                                    <KeyIcon className="size-4" />
                                                    Unit & STNK
                                                    {unitAlreadyDelivered && (
                                                        <Badge variant="secondary">
                                                            Sudah dicatat
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    {canDeliverVehicle
                                                        ? `Sisa tagihan ${currencyFormatter.format(remainingBill)}; tahap ini dapat diproses.`
                                                        : `Terkunci karena sisa tagihan ${currencyFormatter.format(remainingBill)} melebihi Rp 10.000.000.`}
                                                </p>
                                            </div>
                                        </label>

                                        <label
                                            className={`flex gap-3 rounded-xl border p-4 transition-colors ${
                                                recordBpkbDelivery
                                                    ? 'border-blue-500/40 bg-blue-500/5'
                                                    : !canSelectBpkb
                                                      ? 'cursor-not-allowed bg-muted/40 opacity-70'
                                                      : 'cursor-pointer hover:bg-muted/30'
                                            }`}
                                        >
                                            <Checkbox
                                                checked={recordBpkbDelivery}
                                                disabled={
                                                    bpkbAlreadyDelivered ||
                                                    !canSelectBpkb
                                                }
                                                onCheckedChange={(value) =>
                                                    toggleBpkbDelivery(
                                                        value === true,
                                                    )
                                                }
                                                aria-label="Catat penyerahan BPKB dan faktur"
                                            />
                                            <div className="min-w-0 space-y-1">
                                                <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                                                    <ShieldCheckIcon className="size-4" />
                                                    BPKB & Faktur
                                                    {bpkbAlreadyDelivered && (
                                                        <Badge variant="secondary">
                                                            Sudah dicatat
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    {canDeliverBpkb
                                                        ? recordVehicleDelivery ||
                                                          unitAlreadyDelivered
                                                            ? 'Transaksi lunas; dokumen asli dapat diserahkan.'
                                                            : 'Pilih penyerahan unit terlebih dahulu.'
                                                        : 'Ditahan sampai transaksi lunas 100%.'}
                                                </p>
                                            </div>
                                        </label>
                                    </div>
                                    <InputError
                                        message={errors.vehicle_delivered_at}
                                        className={errorClassName}
                                    />
                                </section>

                                {hasSelectedStage && (
                                    <section className="space-y-3 rounded-xl border p-4">
                                        <h3 className="text-sm font-semibold">
                                            Waktu Penyerahan
                                        </h3>
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            {recordVehicleDelivery && (
                                                <div className="grid gap-1.5">
                                                    <Label htmlFor="vehicle-delivered-at">
                                                        Unit & STNK
                                                    </Label>
                                                    <Input
                                                        id="vehicle-delivered-at"
                                                        type="datetime-local"
                                                        value={
                                                            vehicleDeliveredAt
                                                        }
                                                        max={nowForInput()}
                                                        onChange={(event) =>
                                                            setVehicleDeliveredAt(
                                                                event.target
                                                                    .value,
                                                            )
                                                        }
                                                        required
                                                        aria-invalid={Boolean(
                                                            errors.vehicle_delivered_at,
                                                        )}
                                                        className={
                                                            invalidClassName
                                                        }
                                                    />
                                                    <InputError
                                                        message={
                                                            errors.vehicle_delivered_at
                                                        }
                                                        className={
                                                            errorClassName
                                                        }
                                                    />
                                                </div>
                                            )}

                                            {recordBpkbDelivery && (
                                                <div className="grid gap-1.5">
                                                    <Label htmlFor="bpkb-delivered-at">
                                                        BPKB & Faktur Asli
                                                    </Label>
                                                    <Input
                                                        id="bpkb-delivered-at"
                                                        type="datetime-local"
                                                        value={bpkbDeliveredAt}
                                                        max={nowForInput()}
                                                        min={
                                                            vehicleDeliveredAt ||
                                                            undefined
                                                        }
                                                        onChange={(event) =>
                                                            setBpkbDeliveredAt(
                                                                event.target
                                                                    .value,
                                                            )
                                                        }
                                                        required
                                                        aria-invalid={Boolean(
                                                            errors.bpkb_delivered_at,
                                                        )}
                                                        className={
                                                            invalidClassName
                                                        }
                                                    />
                                                    <InputError
                                                        message={
                                                            errors.bpkb_delivered_at
                                                        }
                                                        className={
                                                            errorClassName
                                                        }
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        {recordBpkbDelivery && (
                                            <div className="grid gap-1.5 sm:max-w-xs">
                                                <Label htmlFor="bpkb-recipient-type">
                                                    BPKB diserahkan kepada
                                                </Label>
                                                <Select
                                                    value={bpkbRecipientType}
                                                    onValueChange={(value) =>
                                                        setBpkbRecipientType(
                                                            value as
                                                                | 'customer'
                                                                | 'finance_company',
                                                        )
                                                    }
                                                >
                                                    <SelectTrigger id="bpkb-recipient-type">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="customer">
                                                            Customer
                                                        </SelectItem>
                                                        <SelectItem value="finance_company">
                                                            Perusahaan
                                                            pembiayaan
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <InputError
                                                    message={
                                                        errors.bpkb_recipient_type
                                                    }
                                                    className={errorClassName}
                                                />
                                            </div>
                                        )}
                                    </section>
                                )}

                                <section className="space-y-4 rounded-xl border p-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-2 text-sm font-semibold">
                                            <UserIcon className="size-4 text-primary" />
                                            Penerima & Petugas
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={fillBuyerData}
                                        >
                                            Gunakan data pembeli
                                        </Button>
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="grid gap-1.5">
                                            <Label htmlFor="recipient-name">
                                                Nama penerima
                                            </Label>
                                            <Input
                                                id="recipient-name"
                                                name="recipient_name"
                                                value={recipientName}
                                                onChange={(event) =>
                                                    setRecipientName(
                                                        event.target.value,
                                                    )
                                                }
                                                required
                                                aria-invalid={Boolean(
                                                    errors.recipient_name,
                                                )}
                                                className={invalidClassName}
                                            />
                                            <InputError
                                                message={errors.recipient_name}
                                                className={errorClassName}
                                            />
                                        </div>
                                        <div className="grid gap-1.5">
                                            <Label htmlFor="recipient-relation">
                                                Hubungan dengan pembeli
                                            </Label>
                                            <Select
                                                value={recipientRelation}
                                                onValueChange={(value) =>
                                                    setRecipientRelation(
                                                        value as RecipientRelation,
                                                    )
                                                }
                                            >
                                                <SelectTrigger id="recipient-relation">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="buyer_self">
                                                        Pembeli sendiri
                                                    </SelectItem>
                                                    <SelectItem value="family">
                                                        Keluarga / pasangan
                                                    </SelectItem>
                                                    <SelectItem value="driver">
                                                        Supir / utusan
                                                    </SelectItem>
                                                    <SelectItem value="leasing_officer">
                                                        Petugas pembiayaan
                                                    </SelectItem>
                                                    <SelectItem value="other">
                                                        Lainnya
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid gap-1.5">
                                            <Label htmlFor="recipient-phone">
                                                Nomor HP / WhatsApp
                                            </Label>
                                            <Input
                                                id="recipient-phone"
                                                name="recipient_phone"
                                                value={recipientPhone}
                                                onChange={(event) =>
                                                    setRecipientPhone(
                                                        event.target.value,
                                                    )
                                                }
                                            />
                                            <InputError
                                                message={errors.recipient_phone}
                                                className={errorClassName}
                                            />
                                        </div>
                                        <div className="grid gap-1.5">
                                            <Label htmlFor="recipient-id-card">
                                                NIK penerima
                                            </Label>
                                            <Input
                                                id="recipient-id-card"
                                                name="recipient_id_card"
                                                value={recipientIdCard}
                                                inputMode="numeric"
                                                maxLength={16}
                                                onChange={(event) =>
                                                    setRecipientIdCard(
                                                        event.target.value.replace(
                                                            /\D/g,
                                                            '',
                                                        ),
                                                    )
                                                }
                                                aria-invalid={Boolean(
                                                    errors.recipient_id_card,
                                                )}
                                                className={invalidClassName}
                                            />
                                            <InputError
                                                message={
                                                    errors.recipient_id_card
                                                }
                                                className={errorClassName}
                                            />
                                        </div>
                                        <div className="grid gap-1.5">
                                            <Label htmlFor="officer-name">
                                                Petugas yang menyerahkan
                                            </Label>
                                            <Input
                                                id="officer-name"
                                                name="officer_name"
                                                value={officerName}
                                                onChange={(event) =>
                                                    setOfficerName(
                                                        event.target.value,
                                                    )
                                                }
                                                required
                                                aria-invalid={Boolean(
                                                    errors.officer_name,
                                                )}
                                                className={invalidClassName}
                                            />
                                            <InputError
                                                message={errors.officer_name}
                                                className={errorClassName}
                                            />
                                        </div>
                                        <div className="grid gap-1.5">
                                            <Label htmlFor="handover-location">
                                                Lokasi penyerahan
                                            </Label>
                                            <Select
                                                value={handoverLocation}
                                                onValueChange={
                                                    setHandoverLocation
                                                }
                                            >
                                                <SelectTrigger id="handover-location">
                                                    <MapPinIcon />
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Showroom Telaga Berlian">
                                                        Showroom Telaga Berlian
                                                    </SelectItem>
                                                    <SelectItem value="Alamat Customer">
                                                        Alamat customer
                                                    </SelectItem>
                                                    <SelectItem value="Kantor Perusahaan Pembiayaan">
                                                        Kantor perusahaan
                                                        pembiayaan
                                                    </SelectItem>
                                                    <SelectItem value="Lokasi Lainnya">
                                                        Lokasi lainnya
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid gap-1.5 sm:col-span-2">
                                            <Label htmlFor="handover-address">
                                                Alamat lengkap penyerahan
                                            </Label>
                                            <Input
                                                id="handover-address"
                                                name="handover_address"
                                                value={handoverAddress}
                                                onChange={(event) =>
                                                    setHandoverAddress(
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="Isi jika penyerahan dilakukan di luar showroom"
                                            />
                                            <InputError
                                                message={
                                                    errors.handover_address
                                                }
                                                className={errorClassName}
                                            />
                                        </div>
                                    </div>
                                </section>

                                <section className="space-y-4 rounded-xl border p-4">
                                    <div className="flex items-center gap-2 text-sm font-semibold">
                                        <KeyIcon className="size-4 text-primary" />
                                        Checklist Kelengkapan
                                    </div>

                                    <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                                        {[
                                            {
                                                label: 'STNK asli',
                                                checked: hasStnk,
                                                setChecked: setHasStnk,
                                            },
                                            {
                                                label: 'Buku manual / servis',
                                                checked: hasManualBook,
                                                setChecked: setHasManualBook,
                                            },
                                            {
                                                label: 'Tool kit & dongkrak',
                                                checked: hasToolkit,
                                                setChecked: setHasToolkit,
                                            },
                                            {
                                                label: 'Ban cadangan',
                                                checked: hasSpareTire,
                                                setChecked: setHasSpareTire,
                                            },
                                        ].map((item) => (
                                            <label
                                                key={item.label}
                                                className="flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5"
                                            >
                                                <Checkbox
                                                    checked={item.checked}
                                                    onCheckedChange={(value) =>
                                                        item.setChecked(
                                                            value === true,
                                                        )
                                                    }
                                                />
                                                {item.label}
                                            </label>
                                        ))}

                                        <label
                                            className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 ${
                                                recordBpkbDelivery
                                                    ? 'cursor-pointer'
                                                    : 'cursor-not-allowed opacity-60'
                                            }`}
                                        >
                                            <Checkbox
                                                checked={hasBpkb}
                                                disabled={!recordBpkbDelivery}
                                                onCheckedChange={(value) =>
                                                    setHasBpkb(value === true)
                                                }
                                            />
                                            BPKB asli
                                        </label>
                                        <label
                                            className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 ${
                                                recordBpkbDelivery
                                                    ? 'cursor-pointer'
                                                    : 'cursor-not-allowed opacity-60'
                                            }`}
                                        >
                                            <Checkbox
                                                checked={hasFaktur}
                                                disabled={!recordBpkbDelivery}
                                                onCheckedChange={(value) =>
                                                    setHasFaktur(value === true)
                                                }
                                            />
                                            Faktur asli
                                        </label>
                                    </div>
                                    <InputError
                                        message={
                                            errors['checklist.has_bpkb'] ??
                                            errors['checklist.has_faktur']
                                        }
                                        className={errorClassName}
                                    />

                                    <div className="grid gap-4 sm:grid-cols-3">
                                        <div className="grid gap-1.5">
                                            <Label>Jumlah kunci</Label>
                                            <Select
                                                value={String(keyCount)}
                                                onValueChange={(value) =>
                                                    setKeyCount(Number(value))
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="1">
                                                        1 kunci
                                                    </SelectItem>
                                                    <SelectItem value="2">
                                                        2 kunci
                                                    </SelectItem>
                                                    <SelectItem value="3">
                                                        3 kunci
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid gap-1.5">
                                            <Label>Level bahan bakar</Label>
                                            <Select
                                                value={fuelLevel}
                                                onValueChange={setFuelLevel}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Full">
                                                        Penuh
                                                    </SelectItem>
                                                    <SelectItem value="3/4">
                                                        3/4 tangki
                                                    </SelectItem>
                                                    <SelectItem value="1/2">
                                                        1/2 tangki
                                                    </SelectItem>
                                                    <SelectItem value="1/4">
                                                        1/4 tangki
                                                    </SelectItem>
                                                    <SelectItem value="Reserve">
                                                        Cadangan
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid gap-1.5">
                                            <Label>Kondisi kebersihan</Label>
                                            <Select
                                                value={cleanliness}
                                                onValueChange={setCleanliness}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Bersih & Salon Siap Pakai">
                                                        Bersih & salon
                                                    </SelectItem>
                                                    <SelectItem value="Standar Bersih Cuci">
                                                        Standar cuci
                                                    </SelectItem>
                                                    <SelectItem value="Apa Adanya">
                                                        Apa adanya
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </section>

                                <section className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2">
                                    <div className="grid content-start gap-1.5">
                                        <Label htmlFor="proof-file">
                                            Bukti serah terima
                                        </Label>
                                        <div className="relative">
                                            <UploadSimpleIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                            <Input
                                                id="proof-file"
                                                name="proof_file"
                                                type="file"
                                                accept=".jpg,.jpeg,.png,.pdf"
                                                className="pl-9 file:mr-2"
                                                aria-invalid={Boolean(
                                                    errors.proof_file,
                                                )}
                                            />
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            JPG, PNG, atau PDF; maksimal 5 MB.
                                        </p>
                                        <InputError
                                            message={errors.proof_file}
                                            className={errorClassName}
                                        />
                                        {existing?.proof_file && (
                                            <Button
                                                type="button"
                                                variant="link"
                                                className="h-auto justify-start px-0"
                                                asChild
                                            >
                                                <a
                                                    href={`/handovers/${existing.id}/proof`}
                                                >
                                                    <FileArrowDownIcon />
                                                    Unduh bukti tersimpan
                                                </a>
                                            </Button>
                                        )}
                                    </div>
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="handover-notes">
                                            Catatan
                                        </Label>
                                        <Textarea
                                            id="handover-notes"
                                            name="notes"
                                            value={notes}
                                            onChange={(event) =>
                                                setNotes(event.target.value)
                                            }
                                            rows={4}
                                            placeholder="Kondisi khusus, kekurangan, atau keterangan lain"
                                        />
                                        <InputError
                                            message={errors.notes}
                                            className={errorClassName}
                                        />
                                    </div>
                                </section>

                                {!hasSelectedStage && (
                                    <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-700 dark:text-amber-300">
                                        <LockKeyIcon className="mt-0.5 size-4 shrink-0" />
                                        Pilih penyerahan unit atau BPKB sebelum
                                        menyimpan.
                                    </div>
                                )}
                            </div>

                            <DialogFooter className="border-t bg-background px-5 py-4 sm:px-6">
                                <DialogClose asChild>
                                    <Button type="button" variant="outline">
                                        Batal
                                    </Button>
                                </DialogClose>
                                <Button
                                    type="submit"
                                    disabled={processing || !hasSelectedStage}
                                >
                                    {processing ? (
                                        <Spinner />
                                    ) : existing ? (
                                        <FloppyDiskIcon />
                                    ) : (
                                        <CheckCircleIcon />
                                    )}
                                    {processing
                                        ? 'Menyimpan...'
                                        : existing
                                          ? 'Simpan perubahan'
                                          : 'Catat penyerahan'}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}

import { Form } from '@inertiajs/react';
import {
    CameraIcon,
    CheckCircleIcon,
    ClockCounterClockwiseIcon,
    PackageIcon,
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
import { TimelineEvent } from '@/pages/handovers/timeline-event';
import type {
    HandoverItemCode,
    RecipientRelation,
    Sale,
    VehicleHandoverEvent,
} from '@/pages/sales/types';

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    sale: Sale;
};

const itemOptions: Array<{ value: HandoverItemCode; label: string }> = [
    { value: 'vehicle', label: 'Unit kendaraan' },
    { value: 'stnk', label: 'STNK asli' },
    { value: 'bpkb', label: 'BPKB asli' },
    { value: 'invoice', label: 'Faktur kendaraan' },
    { value: 'keys', label: 'Kunci kendaraan' },
    { value: 'manual_book', label: 'Buku manual' },
    { value: 'service_book', label: 'Buku servis' },
    { value: 'toolkit', label: 'Toolkit dan dongkrak' },
    { value: 'spare_tire', label: 'Ban cadangan' },
    { value: 'blanko', label: 'Blanko dokumen' },
    { value: 'other', label: 'Barang lainnya' },
];

const currencyFormatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
});

const relationLabels: Record<RecipientRelation, string> = {
    buyer_self: 'Pembeli sendiri',
    family: 'Keluarga pembeli',
    driver: 'Sopir / perwakilan',
    leasing_officer: 'Petugas leasing',
    other: 'Pihak lainnya',
};

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

function getDeliveredItems(events: VehicleHandoverEvent[]) {
    return new Set(
        events.flatMap((event) =>
            event.items
                .filter((item) => item.item_code !== 'other')
                .map((item) => item.item_code),
        ),
    );
}

export function HandoverDialog({ open, onOpenChange, sale }: Props) {
    const events = sale.handover?.events ?? [];
    const deliveredItems = getDeliveredItems(events);
    const remainingBill = sale.remaining_bill ?? sale.deal_price;
    const canDeliverVehicle =
        sale.can_deliver_vehicle ?? remainingBill <= 10_000_000;
    const canDeliverBpkb = sale.can_deliver_bpkb ?? remainingBill <= 0;
    const unitAlreadyDelivered = deliveredItems.has('vehicle');
    const bpkbAlreadyDelivered = deliveredItems.has('bpkb');
    const initialItems: HandoverItemCode[] =
        !unitAlreadyDelivered && canDeliverVehicle
            ? [
                  'vehicle',
                  'stnk',
                  'keys',
                  'manual_book',
                  'toolkit',
                  'spare_tire',
              ]
            : unitAlreadyDelivered && !bpkbAlreadyDelivered && canDeliverBpkb
              ? [
                    'bpkb',
                    ...(deliveredItems.has('invoice')
                        ? []
                        : (['invoice'] as HandoverItemCode[])),
                ]
              : [];

    const [selectedItems, setSelectedItems] =
        useState<HandoverItemCode[]>(initialItems);
    const [occurredAt, setOccurredAt] = useState(nowForInput());
    const [recipientName, setRecipientName] = useState('');
    const [recipientPhone, setRecipientPhone] = useState('');
    const [recipientIdCard, setRecipientIdCard] = useState('');
    const [recipientRelation, setRecipientRelation] = useState<
        RecipientRelation | ''
    >('');
    const [officerName, setOfficerName] = useState('Admin Showroom');
    const [handoverLocation, setHandoverLocation] = useState(
        'Showroom Telaga Berlian',
    );
    const [handoverAddress, setHandoverAddress] = useState('');
    const [keyCount, setKeyCount] = useState('2');
    const [otherItemName, setOtherItemName] = useState('');
    const [fuelLevel, setFuelLevel] = useState('1/2');
    const [cleanliness, setCleanliness] = useState('Bersih & Salon Siap Pakai');
    const [notes, setNotes] = useState('');
    const [photoCount, setPhotoCount] = useState(0);
    const timeline = [...events].sort(
        (left, right) =>
            new Date(right.occurred_at).getTime() -
            new Date(left.occurred_at).getTime(),
    );

    function isItemDisabled(item: HandoverItemCode): boolean {
        if (item !== 'other' && deliveredItems.has(item)) {
            return true;
        }

        if (item === 'vehicle') {
            return !canDeliverVehicle;
        }

        if (item === 'bpkb') {
            return (
                !canDeliverBpkb ||
                (!unitAlreadyDelivered && !selectedItems.includes('vehicle'))
            );
        }

        if (item === 'invoice') {
            return !canDeliverBpkb;
        }

        return false;
    }

    function toggleItem(item: HandoverItemCode, checked: boolean) {
        setSelectedItems((current) => {
            const next = checked
                ? [...new Set([...current, item])]
                : current.filter((value) => value !== item);

            if (
                item === 'bpkb' &&
                checked &&
                !deliveredItems.has('invoice') &&
                !next.includes('invoice')
            ) {
                next.push('invoice');
            }

            return next;
        });
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
            <DialogContent className="flex max-h-[94vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl">
                <DialogHeader className="border-b px-5 py-4 pr-12 sm:px-6">
                    <DialogTitle className="flex items-center gap-2">
                        <ClockCounterClockwiseIcon className="size-5 text-primary" />
                        Tracking Penyerahan Unit
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
                            <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-5 sm:px-6">
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
                                {selectedItems.map((item) => (
                                    <input
                                        key={item}
                                        type="hidden"
                                        name="items[]"
                                        value={item}
                                    />
                                ))}
                                {selectedItems.includes('keys') && (
                                    <input
                                        type="hidden"
                                        name="key_count"
                                        value={keyCount}
                                    />
                                )}
                                {selectedItems.includes('other') && (
                                    <input
                                        type="hidden"
                                        name="other_item_name"
                                        value={otherItemName}
                                    />
                                )}
                                {selectedItems.includes('vehicle') && (
                                    <>
                                        <input
                                            type="hidden"
                                            name="vehicle_condition[fuel_level]"
                                            value={fuelLevel}
                                        />
                                        <input
                                            type="hidden"
                                            name="vehicle_condition[cleanliness]"
                                            value={cleanliness}
                                        />
                                    </>
                                )}

                                <section className="grid gap-3 rounded-xl border bg-muted/20 p-4 sm:grid-cols-3">
                                    <div>
                                        <p className="text-xs text-muted-foreground">
                                            Sisa tagihan
                                        </p>
                                        <p className="font-semibold">
                                            {currencyFormatter.format(
                                                remainingBill,
                                            )}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">
                                            Penyerahan unit
                                        </p>
                                        <p className="font-semibold">
                                            {unitAlreadyDelivered
                                                ? 'Sudah diserahkan'
                                                : canDeliverVehicle
                                                  ? 'Dapat diserahkan'
                                                  : 'Masih terkunci'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">
                                            Penyerahan BPKB
                                        </p>
                                        <p className="font-semibold">
                                            {bpkbAlreadyDelivered
                                                ? 'Sudah diserahkan'
                                                : canDeliverBpkb
                                                  ? 'Dapat diserahkan'
                                                  : 'Menunggu pelunasan'}
                                        </p>
                                    </div>
                                </section>

                                {timeline.length > 0 && (
                                    <section className="space-y-3">
                                        <div>
                                            <h3 className="text-sm font-semibold">
                                                Riwayat tracking
                                            </h3>
                                            <p className="text-xs text-muted-foreground">
                                                Setiap kejadian disimpan sebagai
                                                riwayat terpisah dan tidak
                                                menimpa data sebelumnya.
                                            </p>
                                        </div>
                                        <div className="space-y-3">
                                            {timeline.map((event) => (
                                                <TimelineEvent
                                                    key={event.id}
                                                    event={event}
                                                />
                                            ))}
                                        </div>
                                    </section>
                                )}

                                <section className="space-y-4 rounded-xl border p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                            <PackageIcon className="size-4" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-semibold">
                                                Tambah tracking baru
                                            </h3>
                                            <p className="text-xs text-muted-foreground">
                                                Pilih tepat sesuai barang dan
                                                dokumen yang benar-benar
                                                diserahkan saat kejadian ini.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid gap-1.5 sm:max-w-sm">
                                        <Label htmlFor="handover-occurred-at">
                                            Tanggal dan waktu kejadian
                                        </Label>
                                        <Input
                                            id="handover-occurred-at"
                                            name="occurred_at"
                                            type="datetime-local"
                                            value={occurredAt}
                                            max={nowForInput()}
                                            onChange={(event) =>
                                                setOccurredAt(
                                                    event.target.value,
                                                )
                                            }
                                            className={invalidClassName}
                                            aria-invalid={Boolean(
                                                errors.occurred_at,
                                            )}
                                        />
                                        <InputError
                                            message={errors.occurred_at}
                                            className={errorClassName}
                                        />
                                    </div>

                                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                        {itemOptions.map((item) => {
                                            const disabled = isItemDisabled(
                                                item.value,
                                            );
                                            const checked =
                                                selectedItems.includes(
                                                    item.value,
                                                );

                                            return (
                                                <label
                                                    key={item.value}
                                                    className={`flex items-start gap-3 rounded-lg border p-3 text-sm transition-colors ${
                                                        disabled
                                                            ? 'cursor-not-allowed bg-muted/40 opacity-60'
                                                            : checked
                                                              ? 'cursor-pointer border-primary/40 bg-primary/5'
                                                              : 'cursor-pointer hover:bg-muted/30'
                                                    }`}
                                                >
                                                    <Checkbox
                                                        checked={checked}
                                                        disabled={disabled}
                                                        onCheckedChange={(
                                                            value,
                                                        ) =>
                                                            toggleItem(
                                                                item.value,
                                                                value === true,
                                                            )
                                                        }
                                                    />
                                                    <span>
                                                        {item.label}
                                                        {deliveredItems.has(
                                                            item.value,
                                                        ) &&
                                                            item.value !==
                                                                'other' && (
                                                                <span className="block text-xs text-muted-foreground">
                                                                    Sudah
                                                                    diserahkan
                                                                </span>
                                                            )}
                                                    </span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                    <InputError
                                        message={errors.items}
                                        className={errorClassName}
                                    />

                                    {(selectedItems.includes('keys') ||
                                        selectedItems.includes('other') ||
                                        selectedItems.includes('vehicle')) && (
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            {selectedItems.includes('keys') && (
                                                <div className="grid gap-1.5">
                                                    <Label>Jumlah kunci</Label>
                                                    <Select
                                                        value={keyCount}
                                                        onValueChange={
                                                            setKeyCount
                                                        }
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {[1, 2, 3].map(
                                                                (count) => (
                                                                    <SelectItem
                                                                        key={
                                                                            count
                                                                        }
                                                                        value={String(
                                                                            count,
                                                                        )}
                                                                    >
                                                                        {count}{' '}
                                                                        kunci
                                                                    </SelectItem>
                                                                ),
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                    <InputError
                                                        message={
                                                            errors.key_count
                                                        }
                                                        className={
                                                            errorClassName
                                                        }
                                                    />
                                                </div>
                                            )}

                                            {selectedItems.includes(
                                                'other',
                                            ) && (
                                                <div className="grid gap-1.5">
                                                    <Label htmlFor="other-item-name">
                                                        Nama barang lainnya
                                                    </Label>
                                                    <Input
                                                        id="other-item-name"
                                                        value={otherItemName}
                                                        onChange={(event) =>
                                                            setOtherItemName(
                                                                event.target
                                                                    .value,
                                                            )
                                                        }
                                                        placeholder="Contoh: remote alarm"
                                                        aria-invalid={Boolean(
                                                            errors.other_item_name,
                                                        )}
                                                    />
                                                    <InputError
                                                        message={
                                                            errors.other_item_name
                                                        }
                                                        className={
                                                            errorClassName
                                                        }
                                                    />
                                                </div>
                                            )}

                                            {selectedItems.includes(
                                                'vehicle',
                                            ) && (
                                                <>
                                                    <div className="grid gap-1.5">
                                                        <Label>
                                                            Level bahan bakar
                                                        </Label>
                                                        <Select
                                                            value={fuelLevel}
                                                            onValueChange={
                                                                setFuelLevel
                                                            }
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {[
                                                                    'Full',
                                                                    '3/4',
                                                                    '1/2',
                                                                    '1/4',
                                                                    'Reserve',
                                                                ].map(
                                                                    (value) => (
                                                                        <SelectItem
                                                                            key={
                                                                                value
                                                                            }
                                                                            value={
                                                                                value
                                                                            }
                                                                        >
                                                                            {
                                                                                value
                                                                            }
                                                                        </SelectItem>
                                                                    ),
                                                                )}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="grid gap-1.5">
                                                        <Label>
                                                            Kondisi kebersihan
                                                        </Label>
                                                        <Select
                                                            value={cleanliness}
                                                            onValueChange={
                                                                setCleanliness
                                                            }
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {[
                                                                    'Bersih & Salon Siap Pakai',
                                                                    'Standar Bersih Cuci',
                                                                    'Apa Adanya',
                                                                ].map(
                                                                    (value) => (
                                                                        <SelectItem
                                                                            key={
                                                                                value
                                                                            }
                                                                            value={
                                                                                value
                                                                            }
                                                                        >
                                                                            {
                                                                                value
                                                                            }
                                                                        </SelectItem>
                                                                    ),
                                                                )}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </section>

                                <section className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <div>
                                                <h3 className="text-sm font-semibold">
                                                    Penerima
                                                </h3>
                                                <p className="text-xs text-muted-foreground">
                                                    Pihak yang menerima pada
                                                    kejadian ini.
                                                </p>
                                            </div>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                onClick={fillBuyerData}
                                            >
                                                Gunakan data pembeli
                                            </Button>
                                        </div>
                                        <div className="grid gap-1.5">
                                            <Label htmlFor="recipient-name">
                                                Nama penerima *
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
                                                aria-invalid={Boolean(
                                                    errors.recipient_name,
                                                )}
                                            />
                                            <InputError
                                                message={errors.recipient_name}
                                                className={errorClassName}
                                            />
                                        </div>
                                        <div className="grid gap-1.5">
                                            <Label>Hubungan penerima *</Label>
                                            <Select
                                                value={recipientRelation}
                                                onValueChange={(value) =>
                                                    setRecipientRelation(
                                                        value as RecipientRelation,
                                                    )
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Pilih hubungan dengan pembeli" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Object.entries(
                                                        relationLabels,
                                                    ).map(([value, label]) => (
                                                        <SelectItem
                                                            key={value}
                                                            value={value}
                                                        >
                                                            {label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <InputError
                                                message={
                                                    errors.recipient_relation
                                                }
                                                className={errorClassName}
                                            />
                                        </div>
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            <div className="grid gap-1.5">
                                                <Label htmlFor="recipient-phone">
                                                    Nomor HP
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
                                                    onChange={(event) =>
                                                        setRecipientIdCard(
                                                            event.target.value
                                                                .replace(
                                                                    /\D/g,
                                                                    '',
                                                                )
                                                                .slice(0, 16),
                                                        )
                                                    }
                                                    aria-invalid={Boolean(
                                                        errors.recipient_id_card,
                                                    )}
                                                />
                                                <InputError
                                                    message={
                                                        errors.recipient_id_card
                                                    }
                                                    className={errorClassName}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <h3 className="text-sm font-semibold">
                                                Petugas dan lokasi
                                            </h3>
                                            <p className="text-xs text-muted-foreground">
                                                Informasi pelaksana penyerahan.
                                            </p>
                                        </div>
                                        <div className="grid gap-1.5">
                                            <Label htmlFor="officer-name">
                                                Nama petugas
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
                                                aria-invalid={Boolean(
                                                    errors.officer_name,
                                                )}
                                            />
                                            <InputError
                                                message={errors.officer_name}
                                                className={errorClassName}
                                            />
                                        </div>
                                        <div className="grid gap-1.5">
                                            <Label>Lokasi penyerahan</Label>
                                            <Select
                                                value={handoverLocation}
                                                onValueChange={
                                                    setHandoverLocation
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Showroom Telaga Berlian">
                                                        Showroom Telaga Berlian
                                                    </SelectItem>
                                                    <SelectItem value="Alamat customer">
                                                        Alamat customer
                                                    </SelectItem>
                                                    <SelectItem value="Kantor leasing">
                                                        Kantor leasing
                                                    </SelectItem>
                                                    <SelectItem value="Lokasi lainnya">
                                                        Lokasi lainnya
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid gap-1.5">
                                            <Label htmlFor="handover-address">
                                                Alamat lengkap
                                            </Label>
                                            <Textarea
                                                id="handover-address"
                                                name="handover_address"
                                                value={handoverAddress}
                                                onChange={(event) =>
                                                    setHandoverAddress(
                                                        event.target.value,
                                                    )
                                                }
                                                rows={3}
                                            />
                                        </div>
                                    </div>
                                </section>

                                <section className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2">
                                    <div className="grid content-start gap-1.5">
                                        <Label htmlFor="handover-photos">
                                            Foto bukti
                                        </Label>
                                        <div className="relative">
                                            <CameraIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                            <Input
                                                id="handover-photos"
                                                name="photos[]"
                                                type="file"
                                                accept="image/jpeg,image/png,image/webp"
                                                multiple
                                                required
                                                className="pl-9 file:mr-2"
                                                onChange={(event) =>
                                                    setPhotoCount(
                                                        event.target.files
                                                            ?.length ?? 0,
                                                    )
                                                }
                                                aria-invalid={Boolean(
                                                    errors.photos,
                                                )}
                                            />
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Wajib 1–5 foto JPG, PNG, atau WebP;
                                            maksimal 5 MB per foto.
                                        </p>
                                        {photoCount > 0 && (
                                            <p className="text-xs font-medium text-primary">
                                                {photoCount} foto dipilih
                                            </p>
                                        )}
                                        <InputError
                                            message={
                                                errors.photos ??
                                                errors['photos.0']
                                            }
                                            className={errorClassName}
                                        />
                                    </div>
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="handover-notes">
                                            Catatan kejadian
                                        </Label>
                                        <Textarea
                                            id="handover-notes"
                                            name="notes"
                                            value={notes}
                                            onChange={(event) =>
                                                setNotes(event.target.value)
                                            }
                                            rows={4}
                                            placeholder="Kondisi khusus atau keterangan tambahan"
                                        />
                                    </div>
                                </section>
                            </div>

                            <DialogFooter className="border-t bg-background px-5 py-4 sm:px-6">
                                <DialogClose asChild>
                                    <Button type="button" variant="outline">
                                        Batal
                                    </Button>
                                </DialogClose>
                                <Button
                                    type="submit"
                                    disabled={
                                        processing ||
                                        selectedItems.length === 0 ||
                                        photoCount === 0 ||
                                        recipientName.trim().length === 0 ||
                                        recipientRelation === '' ||
                                        officerName.trim().length === 0 ||
                                        handoverLocation.length === 0
                                    }
                                >
                                    {processing ? (
                                        <Spinner />
                                    ) : (
                                        <CheckCircleIcon />
                                    )}
                                    {processing
                                        ? 'Menyimpan...'
                                        : 'Simpan tracking'}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}

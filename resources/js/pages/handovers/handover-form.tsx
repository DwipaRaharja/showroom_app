import { Form, Link } from '@inertiajs/react';
import { CameraIcon, FloppyDiskIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import VehicleHandoverController from '@/actions/App/Http/Controllers/VehicleHandoverController';
import { CardSectionHeader } from '@/components/card-section-header';
import InputError from '@/components/input-error';
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
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency } from '@/lib/formatters';
import type {
    HandoverItemCode,
    RecipientRelation,
    Sale,
    VehicleHandoverEvent,
} from '@/pages/sales/types';

type Props = {
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

const relationLabels: Record<RecipientRelation, string> = {
    buyer_self: 'Pembeli sendiri',
    family: 'Keluarga pembeli',
    driver: 'Sopir / perwakilan',
    leasing_officer: 'Petugas leasing',
    other: 'Pihak lainnya',
};

const validationColorClassName =
    'aria-invalid:border-red-500 aria-invalid:ring-red-500/20 dark:aria-invalid:ring-red-500/40';
const errorTextClassName = 'text-red-500 dark:text-red-500';

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

export function HandoverForm({ sale }: Props) {
    const isCredit = sale.payment_type === 'credit';
    const events = sale.handover?.events ?? [];
    const deliveredItems = getDeliveredItems(events);
    const remainingBill = sale.remaining_bill ?? sale.deal_price;
    const canDeliverVehicle =
        sale.can_deliver_vehicle ?? sale.status !== 'cancelled';
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
    >(isCredit && initialItems.includes('bpkb') ? 'leasing_officer' : '');
    const [officerName, setOfficerName] = useState('Admin Showroom');
    const [handoverLocation, setHandoverLocation] = useState(
        isCredit && initialItems.includes('bpkb')
            ? 'Kantor leasing'
            : 'Showroom Telaga Berlian',
    );
    const [handoverAddress, setHandoverAddress] = useState('');
    const [keyCount, setKeyCount] = useState('2');
    const [otherItemName, setOtherItemName] = useState('');
    const [fuelLevel, setFuelLevel] = useState('1/2');
    const [cleanliness, setCleanliness] = useState('Bersih & Salon Siap Pakai');
    const [notes, setNotes] = useState('');
    const [photoCount, setPhotoCount] = useState(0);

    function isItemDisabled(item: HandoverItemCode): boolean {
        if (item !== 'other' && deliveredItems.has(item)) {
            return true;
        }

        if (item === 'vehicle') {
            return !canDeliverVehicle;
        }

        if (item === 'bpkb') {
            return !canDeliverBpkb || !unitAlreadyDelivered;
        }

        if (item === 'invoice') {
            return !canDeliverBpkb;
        }

        return false;
    }

    function toggleItem(item: HandoverItemCode, checked: boolean) {
        if (item === 'bpkb' && checked && isCredit) {
            setRecipientRelation('leasing_officer');
            setHandoverLocation('Kantor leasing');
        }

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
        <Form
            action={VehicleHandoverController.store.url()}
            method="post"
            options={{ preserveScroll: true }}
            className="space-y-6"
        >
            {({ processing, errors }) => (
                <>
                    <input type="hidden" name="sale_id" value={sale.id} />
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

                    {/* Summary Banner */}
                    <div className="grid gap-4 rounded-xl border bg-muted/20 p-4 sm:grid-cols-3">
                        <div>
                            <p className="text-xs text-muted-foreground">
                                Sisa tagihan
                            </p>
                            <p className="text-base font-semibold">
                                {formatCurrency(remainingBill)}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">
                                Penyerahan unit
                            </p>
                            <p className="text-base font-semibold">
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
                            <p className="text-base font-semibold">
                                {bpkbAlreadyDelivered
                                    ? 'Sudah diserahkan'
                                    : !unitAlreadyDelivered
                                      ? 'Menunggu penyerahan unit'
                                      : canDeliverBpkb
                                        ? 'Dapat diserahkan'
                                        : isCredit
                                          ? 'Menunggu kekurangan customer'
                                          : 'Menunggu pelunasan'}
                            </p>
                        </div>
                    </div>

                    {/* Card 1: Waktu & Item yang Diserahkan */}
                    <Card>
                        <CardSectionHeader
                            title="Waktu & item yang diserahkan"
                            description="Pilih waktu penyerahan dan centang barang atau dokumen yang diserahkan pada tahap ini."
                        />
                        <CardContent className="grid gap-5">
                            <div className="grid gap-2 sm:max-w-sm">
                                <Label htmlFor="handover-occurred-at">
                                    Tanggal dan waktu kejadian{' '}
                                    <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="handover-occurred-at"
                                    name="occurred_at"
                                    type="datetime-local"
                                    value={occurredAt}
                                    max={nowForInput()}
                                    onChange={(event) =>
                                        setOccurredAt(event.target.value)
                                    }
                                    aria-invalid={Boolean(errors.occurred_at)}
                                    className={validationColorClassName}
                                />
                                <InputError
                                    message={errors.occurred_at}
                                    className={errorTextClassName}
                                />
                            </div>

                            <div
                                className={`grid gap-2 rounded-xl p-1 sm:grid-cols-2 lg:grid-cols-3 ${
                                    errors.items
                                        ? 'border border-destructive/50 bg-destructive/5'
                                        : ''
                                }`}
                            >
                                {itemOptions.map((item) => {
                                    const disabled = isItemDisabled(item.value);
                                    const checked = selectedItems.includes(
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
                                                onCheckedChange={(value) =>
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
                                                    item.value !== 'other' && (
                                                        <span className="block text-xs text-muted-foreground">
                                                            Sudah diserahkan
                                                        </span>
                                                    )}
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                            <InputError
                                message={errors.items}
                                className={errorTextClassName}
                            />

                            {(selectedItems.includes('keys') ||
                                selectedItems.includes('other') ||
                                selectedItems.includes('vehicle')) && (
                                <div className="grid gap-5 rounded-lg border bg-muted/30 p-4 sm:grid-cols-2">
                                    {selectedItems.includes('keys') && (
                                        <div className="grid gap-2">
                                            <Label>Jumlah kunci</Label>
                                            <Select
                                                value={keyCount}
                                                onValueChange={setKeyCount}
                                            >
                                                <SelectTrigger
                                                    aria-invalid={Boolean(
                                                        errors.key_count,
                                                    )}
                                                >
                                                    <SelectValue placeholder="Pilih jumlah kunci" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {[1, 2, 3].map((count) => (
                                                        <SelectItem
                                                            key={count}
                                                            value={String(
                                                                count,
                                                            )}
                                                        >
                                                            {count} kunci
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <InputError
                                                message={errors.key_count}
                                                className={errorTextClassName}
                                            />
                                        </div>
                                    )}

                                    {selectedItems.includes('other') && (
                                        <div className="grid gap-2">
                                            <Label htmlFor="other-item-name">
                                                Nama barang lainnya
                                            </Label>
                                            <Input
                                                id="other-item-name"
                                                value={otherItemName}
                                                onChange={(event) =>
                                                    setOtherItemName(
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="Contoh: remote alarm, karpet tambahan"
                                                aria-invalid={Boolean(
                                                    errors.other_item_name,
                                                )}
                                                className={
                                                    validationColorClassName
                                                }
                                            />
                                            <InputError
                                                message={errors.other_item_name}
                                                className={errorTextClassName}
                                            />
                                        </div>
                                    )}

                                    {selectedItems.includes('vehicle') && (
                                        <>
                                            <div className="grid gap-2">
                                                <Label>Level bahan bakar</Label>
                                                <Select
                                                    value={fuelLevel}
                                                    onValueChange={setFuelLevel}
                                                >
                                                    <SelectTrigger
                                                        aria-invalid={Boolean(
                                                            errors.fuel_level,
                                                        )}
                                                    >
                                                        <SelectValue placeholder="Pilih level BBM" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {[
                                                            'Full',
                                                            '3/4',
                                                            '1/2',
                                                            '1/4',
                                                            'Reserve',
                                                        ].map((value) => (
                                                            <SelectItem
                                                                key={value}
                                                                value={value}
                                                            >
                                                                {value}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>
                                                    Kondisi kebersihan
                                                </Label>
                                                <Select
                                                    value={cleanliness}
                                                    onValueChange={
                                                        setCleanliness
                                                    }
                                                >
                                                    <SelectTrigger
                                                        aria-invalid={Boolean(
                                                            errors.cleanliness,
                                                        )}
                                                    >
                                                        <SelectValue placeholder="Pilih kondisi kebersihan" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {[
                                                            'Bersih & Salon Siap Pakai',
                                                            'Standar Bersih Cuci',
                                                            'Apa Adanya',
                                                        ].map((value) => (
                                                            <SelectItem
                                                                key={value}
                                                                value={value}
                                                            >
                                                                {value}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Card 2: Data Penerima */}
                    <Card>
                        <CardSectionHeader
                            title="Data penerima"
                            description="Pihak yang menerima unit atau dokumen pada kejadian ini."
                            action={
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={fillBuyerData}
                                >
                                    Gunakan data pembeli
                                </Button>
                            }
                        />
                        <CardContent className="grid gap-5 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="recipient-name">
                                    Nama penerima{' '}
                                    <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="recipient-name"
                                    name="recipient_name"
                                    value={recipientName}
                                    onChange={(event) =>
                                        setRecipientName(event.target.value)
                                    }
                                    placeholder="Masukkan nama lengkap penerima"
                                    aria-invalid={Boolean(
                                        errors.recipient_name,
                                    )}
                                    className={validationColorClassName}
                                />
                                <InputError
                                    message={errors.recipient_name}
                                    className={errorTextClassName}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>
                                    Hubungan penerima{' '}
                                    <span className="text-red-500">*</span>
                                </Label>
                                <Select
                                    value={recipientRelation}
                                    onValueChange={(value) =>
                                        setRecipientRelation(
                                            value as RecipientRelation,
                                        )
                                    }
                                >
                                    <SelectTrigger
                                        aria-invalid={Boolean(
                                            errors.recipient_relation,
                                        )}
                                        className={validationColorClassName}
                                    >
                                        <SelectValue placeholder="Pilih hubungan dengan pembeli" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(relationLabels).map(
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
                                <InputError
                                    message={errors.recipient_relation}
                                    className={errorTextClassName}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="recipient-phone">
                                    Nomor HP
                                </Label>
                                <Input
                                    id="recipient-phone"
                                    name="recipient_phone"
                                    value={recipientPhone}
                                    onChange={(event) =>
                                        setRecipientPhone(event.target.value)
                                    }
                                    placeholder="Contoh: 081234567890"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="recipient-id-card">
                                    NIK penerima (KTP)
                                </Label>
                                <Input
                                    id="recipient-id-card"
                                    name="recipient_id_card"
                                    value={recipientIdCard}
                                    inputMode="numeric"
                                    onChange={(event) =>
                                        setRecipientIdCard(
                                            event.target.value
                                                .replace(/\D/g, '')
                                                .slice(0, 16),
                                        )
                                    }
                                    placeholder="16 digit NIK sesuai KTP"
                                    aria-invalid={Boolean(
                                        errors.recipient_id_card,
                                    )}
                                    className={validationColorClassName}
                                />
                                <InputError
                                    message={errors.recipient_id_card}
                                    className={errorTextClassName}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Card 3: Petugas & Lokasi Serah Terima */}
                    <Card>
                        <CardSectionHeader
                            title="Petugas & lokasi serah terima"
                            description="Informasi staf pelaksana penyerahan dan alamat lokasi serah terima."
                        />
                        <CardContent className="grid gap-5 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="officer-name">
                                    Nama petugas{' '}
                                    <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="officer-name"
                                    name="officer_name"
                                    value={officerName}
                                    onChange={(event) =>
                                        setOfficerName(event.target.value)
                                    }
                                    placeholder="Nama staf/admin showroom"
                                    aria-invalid={Boolean(errors.officer_name)}
                                    className={validationColorClassName}
                                />
                                <InputError
                                    message={errors.officer_name}
                                    className={errorTextClassName}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>
                                    Lokasi penyerahan{' '}
                                    <span className="text-red-500">*</span>
                                </Label>
                                <Select
                                    value={handoverLocation}
                                    onValueChange={setHandoverLocation}
                                >
                                    <SelectTrigger
                                        aria-invalid={Boolean(
                                            errors.handover_location,
                                        )}
                                        className={validationColorClassName}
                                    >
                                        <SelectValue placeholder="Pilih lokasi penyerahan" />
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
                                <InputError
                                    message={errors.handover_location}
                                    className={errorTextClassName}
                                />
                            </div>
                            <div className="grid gap-2 sm:col-span-2">
                                <Label htmlFor="handover-address">
                                    Alamat lengkap
                                </Label>
                                <Textarea
                                    id="handover-address"
                                    name="handover_address"
                                    value={handoverAddress}
                                    onChange={(event) =>
                                        setHandoverAddress(event.target.value)
                                    }
                                    rows={3}
                                    placeholder="Masukkan alamat lengkap lokasi penyerahan (opsional jika di showroom)"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Card 4: Foto Bukti & Catatan */}
                    <Card>
                        <CardSectionHeader
                            title="Foto bukti & catatan"
                            description="Unggah foto serah terima dan tambahkan catatan kejadian jika diperlukan."
                        />
                        <CardContent className="grid gap-5 sm:grid-cols-2">
                            <div className="grid content-start gap-2">
                                <Label htmlFor="handover-photos">
                                    Foto bukti{' '}
                                    <span className="text-red-500">*</span>
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
                                        className={`pl-9 file:mr-2 ${validationColorClassName}`}
                                        onChange={(event) =>
                                            setPhotoCount(
                                                event.target.files?.length ?? 0,
                                            )
                                        }
                                        aria-invalid={Boolean(errors.photos)}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Wajib 1–5 foto JPG, PNG, atau WebP; maksimal
                                    5 MB per foto.
                                </p>
                                {photoCount > 0 && (
                                    <p className="text-xs font-medium text-primary">
                                        {photoCount} foto dipilih
                                    </p>
                                )}
                                <InputError
                                    message={
                                        errors.photos ?? errors['photos.0']
                                    }
                                    className={errorTextClassName}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="handover-notes">
                                    Catatan kejadian (opsional)
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
                        </CardContent>
                    </Card>

                    {/* Action Footer Buttons */}
                    <div className="flex flex-wrap items-center justify-end gap-3">
                        <Button type="button" variant="outline" asChild>
                            <Link
                                href={VehicleHandoverController.show.url(
                                    sale.id,
                                )}
                            >
                                Batal
                            </Link>
                        </Button>
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
                                <FloppyDiskIcon className="size-4" />
                            )}
                            {processing ? 'Menyimpan...' : 'Simpan tracking'}
                        </Button>
                    </div>
                </>
            )}
        </Form>
    );
}

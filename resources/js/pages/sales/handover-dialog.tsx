import { Form } from '@inertiajs/react';
import {
    CarProfileIcon,
    CheckCircleIcon,
    FileTextIcon,
    FloppyDiskIcon,
    KeyIcon,
    MapPinIcon,
    ShieldCheckIcon,
    UserIcon,
    WarningCircleIcon,
} from '@phosphor-icons/react';
import { useState } from 'react';
import VehicleHandoverController from '@/actions/App/Http/Controllers/VehicleHandoverController';
import InputError from '@/components/input-error';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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

const validationColorClassName =
    'aria-invalid:border-red-500 aria-invalid:ring-red-500/20 dark:aria-invalid:ring-red-500/40';
const errorTextClassName = 'text-red-500 text-xs mt-1';

function formatDateTimeLocal(dateStr?: string | null): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function HandoverDialog({ open, onOpenChange, sale }: Props) {
    const existing = sale.handover;
    const remainingBill = sale.remaining_bill ?? 0;
    const canDeliverVehicle = sale.can_deliver_vehicle ?? (remainingBill <= 10_000_000);
    const canDeliverBpkb = sale.can_deliver_bpkb ?? (remainingBill <= 0);

    const [recipientName, setRecipientName] = useState(
        existing?.recipient_name ?? sale.customer?.name ?? '',
    );
    const [recipientPhone, setRecipientPhone] = useState(
        existing?.recipient_phone ?? sale.customer?.phone ?? '',
    );
    const [recipientIdCard, setRecipientIdCard] = useState(
        existing?.recipient_id_card ?? sale.customer?.ktp_number ?? '',
    );
    const [recipientRelation, setRecipientRelation] = useState<RecipientRelation>(
        existing?.recipient_relation ?? 'buyer_self',
    );
    const [officerName, setOfficerName] = useState(
        existing?.officer_name ?? 'Admin Showroom Telaga Berlian',
    );
    const [handoverLocation, setHandoverLocation] = useState(
        existing?.handover_location ?? 'Showroom Telaga Berlian',
    );
    const [handoverAddress, setHandoverAddress] = useState(
        existing?.handover_address ?? sale.customer?.address ?? '',
    );
    const [vehicleDeliveredAt, setVehicleDeliveredAt] = useState(
        existing?.vehicle_delivered_at
            ? formatDateTimeLocal(existing.vehicle_delivered_at)
            : canDeliverVehicle
              ? formatDateTimeLocal(new Date().toISOString())
              : '',
    );
    const [bpkbDeliveredAt, setBpkbDeliveredAt] = useState(
        existing?.bpkb_delivered_at
            ? formatDateTimeLocal(existing.bpkb_delivered_at)
            : canDeliverBpkb
              ? formatDateTimeLocal(new Date().toISOString())
              : '',
    );
    const [bpkbRecipientType, setBpkbRecipientType] = useState<string>(
        existing?.bpkb_recipient_type ?? (sale.payment_type === 'credit' ? 'finance_company' : 'customer'),
    );

    // Checklist state
    const currentChecklist: HandoverChecklist = existing?.checklist ?? {
        key_count: 2,
        has_stnk: true,
        has_bpkb: canDeliverBpkb,
        has_faktur: canDeliverBpkb,
        has_blanko: canDeliverBpkb,
        has_manual_book: true,
        has_service_book: true,
        has_toolkit: true,
        has_spare_tire: true,
        has_jack: true,
        fuel_level: '1/2',
        cleanliness: 'Bersih & Salon',
    };

    const [keyCount, setKeyCount] = useState(currentChecklist.key_count ?? 2);
    const [hasStnk, setHasStnk] = useState(currentChecklist.has_stnk ?? true);
    const [hasBpkb, setHasBpkb] = useState(currentChecklist.has_bpkb ?? canDeliverBpkb);
    const [hasFaktur, setHasFaktur] = useState(currentChecklist.has_faktur ?? canDeliverBpkb);
    const [hasBlanko, setHasBlanko] = useState(currentChecklist.has_blanko ?? canDeliverBpkb);
    const [hasManualBook, setHasManualBook] = useState(currentChecklist.has_manual_book ?? true);
    const [hasToolkit, setHasToolkit] = useState(currentChecklist.has_toolkit ?? true);
    const [hasSpareTire, setHasSpareTire] = useState(currentChecklist.has_spare_tire ?? true);
    const [fuelLevel, setFuelLevel] = useState(currentChecklist.fuel_level ?? '1/2');
    const [cleanliness, setCleanliness] = useState(currentChecklist.cleanliness ?? 'Bersih & Salon');
    const [notes, setNotes] = useState(existing?.notes ?? '');

    function handleFillCustomerData() {
        if (sale.customer) {
            setRecipientName(sale.customer.name);
            setRecipientPhone(sale.customer.phone ?? '');
            setRecipientIdCard(sale.customer.ktp_number ?? '');
            setRecipientRelation('buyer_self');
            if (sale.customer.address) {
                setHandoverAddress(sale.customer.address);
            }
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg">
                        <CarProfileIcon className="size-5 text-primary" weight="bold" />
                        Serah Terima Kendaraan & Dokumen (BAST)
                    </DialogTitle>
                    <DialogDescription>
                        Pencatatan Berita Acara Serah Terima (BAST) unit {sale.car?.name} ({sale.car?.license_plate ?? 'Tanpa Plat'}).
                    </DialogDescription>
                </DialogHeader>

                {/* Status Guidance Banner */}
                <div className="space-y-2.5">
                    {/* Vehicle Condition */}
                    {canDeliverVehicle ? (
                        <div className="flex items-start gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-900 dark:text-emerald-300">
                            <CheckCircleIcon className="size-4 shrink-0 text-emerald-600 mt-0.5" weight="fill" />
                            <div>
                                <span className="font-semibold">Unit Kendaraan & STNK Boleh Diserahkan:</span> Sisa piutang ({currencyFormatter.format(remainingBill)}) berada di dalam batas toleransi serah terima (maks. Rp 10.000.000).
                            </div>
                        </div>
                    ) : (
                        <Alert variant="destructive" className="py-2.5">
                            <WarningCircleIcon className="size-4" />
                            <AlertTitle className="text-xs font-semibold">Unit Mobil Belum Boleh Diserahkan</AlertTitle>
                            <AlertDescription className="text-xs">
                                Sisa piutang saat ini adalah <strong>{currencyFormatter.format(remainingBill)}</strong> (melebihi batas toleransi Rp 10 Juta). Silakan catat pembayaran DP/termin terlebih dahulu.
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* BPKB Condition */}
                    {canDeliverBpkb ? (
                        <div className="flex items-start gap-2.5 rounded-xl border border-blue-500/30 bg-blue-500/10 p-3 text-xs text-blue-900 dark:text-blue-300">
                            <ShieldCheckIcon className="size-4 shrink-0 text-blue-600 mt-0.5" weight="fill" />
                            <div>
                                <span className="font-semibold">Legalitas BPKB Siap Diserahkan:</span> Transaksi telah Lunas 100%. Dokumen BPKB Asli & Faktur dapat diserahkan ke {sale.payment_type === 'credit' ? 'Lembaga Leasing / Finance' : 'Customer'}.
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-300">
                            <WarningCircleIcon className="size-4 shrink-0 text-amber-600 mt-0.5" weight="fill" />
                            <div>
                                <span className="font-semibold">BPKB Wajib Ditahan di Showroom:</span> BPKB dan Faktur Asli baru dapat diserahkan setelah transaksi lunas 100% (Sisa tagihan Rp 0).
                            </div>
                        </div>
                    )}
                </div>

                <Form
                    action={VehicleHandoverController.store.url()}
                    method="post"
                    options={{
                        preserveScroll: true,
                    }}
                    onSuccess={() => onOpenChange(false)}
                    className="space-y-5 pt-2"
                >
                    {({ processing, errors }) => (
                        <>
                            <input type="hidden" name="sale_id" value={sale.id} />
                            <input type="hidden" name="recipient_relation" value={recipientRelation} />
                            <input type="hidden" name="handover_location" value={handoverLocation} />
                            <input type="hidden" name="bpkb_recipient_type" value={bpkbRecipientType} />

                            {/* Hidden Checklist object */}
                            <input type="hidden" name="checklist[key_count]" value={keyCount} />
                            <input type="hidden" name="checklist[has_stnk]" value={hasStnk ? '1' : '0'} />
                            <input type="hidden" name="checklist[has_bpkb]" value={hasBpkb ? '1' : '0'} />
                            <input type="hidden" name="checklist[has_faktur]" value={hasFaktur ? '1' : '0'} />
                            <input type="hidden" name="checklist[has_blanko]" value={hasBlanko ? '1' : '0'} />
                            <input type="hidden" name="checklist[has_manual_book]" value={hasManualBook ? '1' : '0'} />
                            <input type="hidden" name="checklist[has_toolkit]" value={hasToolkit ? '1' : '0'} />
                            <input type="hidden" name="checklist[has_spare_tire]" value={hasSpareTire ? '1' : '0'} />
                            <input type="hidden" name="checklist[fuel_level]" value={fuelLevel} />
                            <input type="hidden" name="checklist[cleanliness]" value={cleanliness} />

                            {/* Section 1: Pihak Penerima */}
                            <div className="rounded-xl border p-4 space-y-4 bg-muted/20">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 font-semibold text-sm">
                                        <UserIcon className="size-4 text-primary" />
                                        1. Pihak yang Menerima Unit
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleFillCustomerData}
                                        className="text-xs text-primary hover:underline font-medium"
                                    >
                                        Gunakan Data Pembeli
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="recipient_name">Nama Lengkap Penerima</Label>
                                        <Input
                                            id="recipient_name"
                                            name="recipient_name"
                                            value={recipientName}
                                            onChange={(e) => setRecipientName(e.target.value)}
                                            placeholder="Nama penerima..."
                                            required
                                            aria-invalid={Boolean(errors.recipient_name)}
                                            className={validationColorClassName}
                                        />
                                        <InputError message={errors.recipient_name} className={errorTextClassName} />
                                    </div>

                                    <div className="grid gap-1.5">
                                        <Label htmlFor="recipient_phone">No. HP / WhatsApp</Label>
                                        <Input
                                            id="recipient_phone"
                                            name="recipient_phone"
                                            value={recipientPhone}
                                            onChange={(e) => setRecipientPhone(e.target.value)}
                                            placeholder="Contoh: 081234567890"
                                        />
                                        <InputError message={errors.recipient_phone} className={errorTextClassName} />
                                    </div>

                                    <div className="grid gap-1.5">
                                        <Label htmlFor="recipient_id_card">NIK KTP Penerima</Label>
                                        <Input
                                            id="recipient_id_card"
                                            name="recipient_id_card"
                                            value={recipientIdCard}
                                            onChange={(e) => setRecipientIdCard(e.target.value)}
                                            placeholder="16 digit NIK..."
                                        />
                                        <InputError message={errors.recipient_id_card} className={errorTextClassName} />
                                    </div>

                                    <div className="grid gap-1.5">
                                        <Label htmlFor="recipient_relation">Hubungan dengan Pembeli</Label>
                                        <Select
                                            value={recipientRelation}
                                            onValueChange={(val) => setRecipientRelation(val as RecipientRelation)}
                                        >
                                            <SelectTrigger id="recipient_relation">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="buyer_self">Pembeli Sendiri (Customer)</SelectItem>
                                                <SelectItem value="family">Pasangan / Keluarga</SelectItem>
                                                <SelectItem value="driver">Supir / Utusan Khusus</SelectItem>
                                                <SelectItem value="leasing_officer">Petugas / Staff Leasing</SelectItem>
                                                <SelectItem value="other">Lainnya</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Petugas & Lokasi */}
                            <div className="rounded-xl border p-4 space-y-4 bg-muted/20">
                                <div className="flex items-center gap-2 font-semibold text-sm">
                                    <MapPinIcon className="size-4 text-primary" />
                                    2. Petugas & Lokasi Penyerahan
                                </div>

                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="officer_name">Petugas Showroom (Yang Menyerahkan)</Label>
                                        <Input
                                            id="officer_name"
                                            name="officer_name"
                                            value={officerName}
                                            onChange={(e) => setOfficerName(e.target.value)}
                                            required
                                            aria-invalid={Boolean(errors.officer_name)}
                                            className={validationColorClassName}
                                        />
                                        <InputError message={errors.officer_name} className={errorTextClassName} />
                                    </div>

                                    <div className="grid gap-1.5">
                                        <Label htmlFor="handover_location">Lokasi Serah Terima</Label>
                                        <Select value={handoverLocation} onValueChange={setHandoverLocation}>
                                            <SelectTrigger id="handover_location">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Showroom Telaga Berlian">Showroom Telaga Berlian</SelectItem>
                                                <SelectItem value="Diantar ke Alamat Customer">Diantar ke Alamat Customer</SelectItem>
                                                <SelectItem value="Kantor Cabang Leasing">Kantor Cabang Leasing</SelectItem>
                                                <SelectItem value="Lokasi Lainnya">Lokasi Lainnya</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="grid gap-1.5 sm:col-span-2">
                                        <Label htmlFor="handover_address">Alamat Pengiriman / Penyerahan Lengkap</Label>
                                        <Input
                                            id="handover_address"
                                            name="handover_address"
                                            value={handoverAddress}
                                            onChange={(e) => setHandoverAddress(e.target.value)}
                                            placeholder="Alamat lengkap tujuan serah terima..."
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section 3: Waktu & Tanggal Serah Terima */}
                            <div className="rounded-xl border p-4 space-y-4 bg-muted/20">
                                <div className="flex items-center gap-2 font-semibold text-sm">
                                    <FileTextIcon className="size-4 text-primary" />
                                    3. Waktu & Tanggal Serah Terima
                                </div>

                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    {/* Tanggal Mobil & STNK */}
                                    <div className="grid gap-1.5">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="vehicle_delivered_at">Waktu Serah Unit Mobil & STNK</Label>
                                            {canDeliverVehicle && (
                                                <button
                                                    type="button"
                                                    onClick={() => setVehicleDeliveredAt(formatDateTimeLocal(new Date().toISOString()))}
                                                    className="text-[11px] text-primary hover:underline"
                                                >
                                                    Set Sekarang
                                                </button>
                                            )}
                                        </div>
                                        <Input
                                            id="vehicle_delivered_at"
                                            name="vehicle_delivered_at"
                                            type="datetime-local"
                                            value={vehicleDeliveredAt}
                                            onChange={(e) => setVehicleDeliveredAt(e.target.value)}
                                            disabled={!canDeliverVehicle}
                                            aria-invalid={Boolean(errors.vehicle_delivered_at)}
                                            className={validationColorClassName}
                                        />
                                        <p className="text-[11px] text-muted-foreground">
                                            {canDeliverVehicle
                                                ? 'Kosongkan jika unit mobil belum diserahkan ke pembeli.'
                                                : 'Terkunci karena sisa tagihan masih > Rp 10 Juta.'}
                                        </p>
                                        <InputError message={errors.vehicle_delivered_at} className={errorTextClassName} />
                                    </div>

                                    {/* Tanggal BPKB */}
                                    <div className="grid gap-1.5">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="bpkb_delivered_at">Waktu Serah BPKB & Faktur Asli</Label>
                                            {canDeliverBpkb && (
                                                <button
                                                    type="button"
                                                    onClick={() => setBpkbDeliveredAt(formatDateTimeLocal(new Date().toISOString()))}
                                                    className="text-[11px] text-primary hover:underline"
                                                >
                                                    Set Sekarang
                                                </button>
                                            )}
                                        </div>
                                        <Input
                                            id="bpkb_delivered_at"
                                            name="bpkb_delivered_at"
                                            type="datetime-local"
                                            value={bpkbDeliveredAt}
                                            onChange={(e) => setBpkbDeliveredAt(e.target.value)}
                                            disabled={!canDeliverBpkb}
                                            aria-invalid={Boolean(errors.bpkb_delivered_at)}
                                            className={validationColorClassName}
                                        />
                                        <p className="text-[11px] text-muted-foreground">
                                            {canDeliverBpkb
                                                ? 'Diserahkan ke ' + (sale.payment_type === 'credit' ? 'Leasing' : 'Customer')
                                                : 'Terkunci sampai sisa tagihan LUNAS 100% (Rp 0).'}
                                        </p>
                                        <InputError message={errors.bpkb_delivered_at} className={errorTextClassName} />
                                    </div>
                                </div>
                            </div>

                            {/* Section 4: Checklist Fisik & Kelengkapan */}
                            <div className="rounded-xl border p-4 space-y-3 bg-muted/20">
                                <div className="flex items-center gap-2 font-semibold text-sm">
                                    <KeyIcon className="size-4 text-primary" />
                                    4. Checklist Kelengkapan yang Diserahkan
                                </div>

                                <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <Checkbox
                                            checked={hasStnk}
                                            onCheckedChange={(c) => setHasStnk(c === true)}
                                        />
                                        <span>STNK Asli & Pajak Aktif</span>
                                    </label>

                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <Checkbox
                                            checked={hasBpkb}
                                            disabled={!canDeliverBpkb}
                                            onCheckedChange={(c) => setHasBpkb(c === true)}
                                        />
                                        <span className={!canDeliverBpkb ? 'text-muted-foreground line-through' : ''}>
                                            BPKB Asli {!canDeliverBpkb && '(Tahan)'}
                                        </span>
                                    </label>

                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <Checkbox
                                            checked={hasFaktur}
                                            disabled={!canDeliverBpkb}
                                            onCheckedChange={(c) => setHasFaktur(c === true)}
                                        />
                                        <span className={!canDeliverBpkb ? 'text-muted-foreground line-through' : ''}>
                                            Faktur & Kuitansi Blangko
                                        </span>
                                    </label>

                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <Checkbox
                                            checked={hasToolkit}
                                            onCheckedChange={(c) => setHasToolkit(c === true)}
                                        />
                                        <span>Tool Kit & Dongkrak</span>
                                    </label>

                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <Checkbox
                                            checked={hasSpareTire}
                                            onCheckedChange={(c) => setHasSpareTire(c === true)}
                                        />
                                        <span>Ban Cadangan / Serep</span>
                                    </label>

                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <Checkbox
                                            checked={hasManualBook}
                                            onCheckedChange={(c) => setHasManualBook(c === true)}
                                        />
                                        <span>Buku Manual / Servis</span>
                                    </label>
                                </div>

                                <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-3">
                                    <div className="grid gap-1">
                                        <Label htmlFor="key_count" className="text-xs">Jumlah Kunci Kontak</Label>
                                        <Select value={String(keyCount)} onValueChange={(v) => setKeyCount(Number(v))}>
                                            <SelectTrigger id="key_count" className="h-8 text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="1">1 Kunci (Utama)</SelectItem>
                                                <SelectItem value="2">2 Kunci (Utama + Serep)</SelectItem>
                                                <SelectItem value="3">3 Kunci Lengkap</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="grid gap-1">
                                        <Label htmlFor="fuel_level" className="text-xs">Level Bahan Bakar</Label>
                                        <Select value={fuelLevel} onValueChange={setFuelLevel}>
                                            <SelectTrigger id="fuel_level" className="h-8 text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Full">Full (Penuh)</SelectItem>
                                                <SelectItem value="3/4">3/4 Tangki</SelectItem>
                                                <SelectItem value="1/2">1/2 Tangki</SelectItem>
                                                <SelectItem value="1/4">1/4 Tangki</SelectItem>
                                                <SelectItem value="Reserve">Cadangan / E</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="grid gap-1">
                                        <Label htmlFor="cleanliness" className="text-xs">Kondisi Kebersihan Fisik</Label>
                                        <Select value={cleanliness} onValueChange={setCleanliness}>
                                            <SelectTrigger id="cleanliness" className="h-8 text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Bersih & Salon Siap Pakai">Bersih & Salon Siap Pakai</SelectItem>
                                                <SelectItem value="Standar Bersih Cuci">Standar Bersih Cuci</SelectItem>
                                                <SelectItem value="Apa Adanya">Apa Adanya Sesuai Kesepakatan</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            {/* Section 5: Catatan Tambahan */}
                            <div className="grid gap-1.5">
                                <Label htmlFor="notes">Catatan Berita Acara (Opsional)</Label>
                                <Textarea
                                    id="notes"
                                    name="notes"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Catatan kondisi saat serah terima, nomor resi kirim, atau perjanjian khusus..."
                                    rows={2}
                                />
                            </div>

                            <DialogFooter className="gap-2 sm:gap-0 pt-2">
                                <DialogClose asChild>
                                    <Button type="button" variant="outline">
                                        Batal
                                    </Button>
                                </DialogClose>
                                <Button type="submit" disabled={processing} className="gap-1.5">
                                    {processing ? (
                                        <>
                                            <Spinner className="size-4" />
                                            Menyimpan BAST...
                                        </>
                                    ) : (
                                        <>
                                            <FloppyDiskIcon className="size-4" />
                                            Simpan Data Penyerahan (BAST)
                                        </>
                                    )}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}

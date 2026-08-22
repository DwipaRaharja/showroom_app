import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeftIcon,
    CheckCircleIcon,
    PrinterIcon,
    XCircleIcon,
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import type { Sale, VehicleHandover } from '@/pages/sales/types';
import { show as salesShow } from '@/routes/sales';

type Props = {
    sale: Sale;
    handover?: VehicleHandover | null;
};

const currencyFormatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
});

function formatIndonesianDate(dateStr?: string | null): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}

function formatIndonesianDateTime(dateStr?: string | null): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return (
        d.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        }) +
        ' pukul ' +
        d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) +
        ' WIB'
    );
}

export default function BastPrint({ sale, handover }: Props) {
    const checklist = handover?.checklist;
    const remainingBill = sale.remaining_bill ?? 0;

    return (
        <div className="min-h-screen bg-neutral-100 p-4 md:p-8 print:bg-white print:p-0">
            <Head title={`BAST - ${handover?.handover_number ?? sale.invoice_number}`} />

            {/* Top Action Bar (Hidden on Print) */}
            <div className="mx-auto max-w-4xl mb-6 flex items-center justify-between print:hidden">
                <Button variant="outline" size="sm" asChild className="gap-1.5">
                    <Link href={salesShow(sale.id)}>
                        <ArrowLeftIcon className="size-4" />
                        Kembali ke Detail Penjualan
                    </Link>
                </Button>

                <Button
                    onClick={() => window.print()}
                    size="sm"
                    className="gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs"
                >
                    <PrinterIcon className="size-4" />
                    Cetak Dokumen BAST
                </Button>
            </div>

            {/* Printable Document Sheet (A4 format) */}
            <div className="mx-auto max-w-4xl rounded-2xl bg-white p-8 md:p-12 shadow-md print:shadow-none print:p-6 print:rounded-none print:max-w-none text-neutral-900 border border-neutral-200 print:border-none">
                {/* Header / Kop Showroom */}
                <div className="border-b-2 border-neutral-900 pb-4 mb-6 flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-neutral-900">
                            TELAGA BERLIAN MOTOR
                        </h1>
                        <p className="text-xs text-neutral-600 font-medium mt-0.5">
                            Showroom Jual Beli Mobil Bekas Berkualitas & Terpercaya
                        </p>
                        <p className="text-xs text-neutral-500 mt-1">
                            Jl. Raya Showroom No. 88, Telaga Berlian • WhatsApp: 0812-3456-7890 • Email: info@telagaberlian.com
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="text-[11px] uppercase tracking-wider text-neutral-500 font-semibold">
                            No. Dokumen BAST
                        </div>
                        <div className="font-mono text-sm font-bold text-neutral-900">
                            {handover?.handover_number ?? 'BAST-DRAFT'}
                        </div>
                        <div className="text-[11px] text-neutral-500 mt-1 font-mono">
                            Ref: {sale.invoice_number}
                        </div>
                    </div>
                </div>

                {/* Title */}
                <div className="text-center mb-6">
                    <h2 className="text-base font-bold uppercase tracking-wide underline underline-offset-4 text-neutral-900">
                        BERITA ACARA SERAH TERIMA KENDARAAN (BAST)
                    </h2>
                    <p className="text-xs text-neutral-600 mt-1">
                        Tanggal: {formatIndonesianDate(handover?.vehicle_delivered_at ?? sale.created_at)} • Lokasi: {handover?.handover_location ?? 'Showroom Telaga Berlian'}
                    </p>
                </div>

                {/* Body Paragraph */}
                <p className="text-xs leading-relaxed text-neutral-700 mb-4">
                    Pada hari ini, bertempat di <strong>{handover?.handover_location ?? 'Showroom Telaga Berlian'}</strong> ({handover?.handover_address ?? 'Showroom'}), telah dilakukan penyerahan unit kendaraan bermotor dan/atau dokumen kelengkapan oleh dan antara pihak-pihak di bawah ini:
                </p>

                {/* Parties (Pihak I & Pihak II) */}
                <div className="grid grid-cols-2 gap-4 mb-6 text-xs">
                    {/* Pihak I */}
                    <div className="rounded-lg border border-neutral-200 p-3.5 bg-neutral-50">
                        <div className="font-bold text-neutral-900 border-b border-neutral-200 pb-1.5 mb-2 uppercase text-[11px]">
                            PIHAK PERTAMA (Yang Menyerahkan)
                        </div>
                        <table className="w-full text-xs">
                            <tbody>
                                <tr>
                                    <td className="w-24 text-neutral-500 py-0.5">Nama Petugas</td>
                                    <td className="font-semibold text-neutral-900">: {handover?.officer_name ?? 'Admin Showroom'}</td>
                                </tr>
                                <tr>
                                    <td className="text-neutral-500 py-0.5">Instansi/Jabatan</td>
                                    <td>: Showroom Telaga Berlian Motor</td>
                                </tr>
                                <tr>
                                    <td className="text-neutral-500 py-0.5">Alamat</td>
                                    <td>: Jl. Raya Showroom No. 88</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Pihak II */}
                    <div className="rounded-lg border border-neutral-200 p-3.5 bg-neutral-50">
                        <div className="font-bold text-neutral-900 border-b border-neutral-200 pb-1.5 mb-2 uppercase text-[11px]">
                            PIHAK KEDUA (Yang Menerima)
                        </div>
                        <table className="w-full text-xs">
                            <tbody>
                                <tr>
                                    <td className="w-24 text-neutral-500 py-0.5">Nama Penerima</td>
                                    <td className="font-semibold text-neutral-900">: {handover?.recipient_name ?? sale.customer?.name ?? '—'}</td>
                                </tr>
                                <tr>
                                    <td className="text-neutral-500 py-0.5">NIK KTP</td>
                                    <td>: {handover?.recipient_id_card ?? sale.customer?.ktp_number ?? '—'}</td>
                                </tr>
                                <tr>
                                    <td className="text-neutral-500 py-0.5">No. Telepon</td>
                                    <td>: {handover?.recipient_phone ?? sale.customer?.phone ?? '—'}</td>
                                </tr>
                                <tr>
                                    <td className="text-neutral-500 py-0.5">Hubungan</td>
                                    <td>
                                        : {handover?.recipient_relation === 'buyer_self'
                                            ? 'Pembeli Sendiri'
                                            : handover?.recipient_relation === 'family'
                                              ? 'Keluarga / Pasangan'
                                              : handover?.recipient_relation === 'driver'
                                                ? 'Supir / Utusan'
                                                : handover?.recipient_relation === 'leasing_officer'
                                                  ? 'Petugas Leasing'
                                                  : 'Lainnya'} (Customer: {sale.customer?.name})
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Identitas Unit Kendaraan */}
                <div className="rounded-lg border border-neutral-200 p-3.5 mb-6 bg-neutral-50 text-xs">
                    <div className="font-bold text-neutral-900 border-b border-neutral-200 pb-1.5 mb-2 uppercase text-[11px]">
                        IDENTITAS KENDARAAN YANG DISERAHKAN
                    </div>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
                        <div className="flex justify-between">
                            <span className="text-neutral-500">Merek & Tipe Unit:</span>
                            <span className="font-bold text-neutral-900">{sale.car?.brand?.name} {sale.car?.name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-neutral-500">Nomor Polisi:</span>
                            <span className="font-mono font-bold text-neutral-900">{sale.car?.license_plate ?? 'Tanpa Plat'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-neutral-500">Nomor Rangka (VIN):</span>
                            <span className="font-mono text-neutral-900">{sale.car?.chassis_number ?? '—'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-neutral-500">Nomor Mesin:</span>
                            <span className="font-mono text-neutral-900">{sale.car?.engine_number ?? '—'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-neutral-500">Tahun Pembuatan:</span>
                            <span className="text-neutral-900">{sale.car?.year}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-neutral-500">Warna Kendaraan:</span>
                            <span className="text-neutral-900">{sale.car?.color ?? '—'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-neutral-500">Transmisi / Bahan Bakar:</span>
                            <span className="capitalize text-neutral-900">{sale.car?.transmission} / {sale.car?.fuel_type}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-neutral-500">Jarak Tempuh (Odometer):</span>
                            <span className="font-mono text-neutral-900">{sale.car?.mileage ? sale.car.mileage.toLocaleString('id-ID') : 0} km</span>
                        </div>
                    </div>
                </div>

                {/* Checklist Kelengkapan & Legalitas */}
                <div className="rounded-lg border border-neutral-200 mb-6 overflow-hidden text-xs">
                    <div className="bg-neutral-100 px-3.5 py-2 font-bold text-neutral-900 border-b border-neutral-200 uppercase text-[11px]">
                        CHECKLIST KELENGKAPAN FISIK & DOKUMEN
                    </div>
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="border-b border-neutral-200 bg-neutral-50/50 text-neutral-500">
                                <th className="text-left py-2 px-3 w-8">No</th>
                                <th className="text-left py-2 px-3">Item Kelengkapan</th>
                                <th className="text-center py-2 px-3 w-28">Status</th>
                                <th className="text-left py-2 px-3">Keterangan</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200">
                            <tr>
                                <td className="py-2 px-3 text-neutral-500">1</td>
                                <td className="py-2 px-3 font-medium">Fisik Unit Kendaraan</td>
                                <td className="py-2 px-3 text-center">
                                    {handover?.vehicle_delivered_at ? (
                                        <span className="font-bold text-emerald-700">Diserahkan</span>
                                    ) : (
                                        <span className="text-neutral-400">Belum</span>
                                    )}
                                </td>
                                <td className="py-2 px-3 text-neutral-600">
                                    {handover?.vehicle_delivered_at
                                        ? `Diserahkan pada ${formatIndonesianDateTime(handover.vehicle_delivered_at)}`
                                        : `Sisa piutang Rp ${remainingBill.toLocaleString('id-ID')}`}
                                </td>
                            </tr>
                            <tr>
                                <td className="py-2 px-3 text-neutral-500">2</td>
                                <td className="py-2 px-3 font-medium">Kunci Kontak Kendaraan</td>
                                <td className="py-2 px-3 text-center font-bold text-emerald-700">
                                    {checklist?.key_count ?? 2} Kunci
                                </td>
                                <td className="py-2 px-3 text-neutral-600">
                                    {checklist?.key_count && checklist.key_count > 1 ? 'Kunci Utama + Kunci Cadangan' : 'Kunci Utama'}
                                </td>
                            </tr>
                            <tr>
                                <td className="py-2 px-3 text-neutral-500">3</td>
                                <td className="py-2 px-3 font-medium">STNK Asli & Surat Ketetapan Pajak</td>
                                <td className="py-2 px-3 text-center">
                                    {checklist?.has_stnk !== false ? (
                                        <span className="font-bold text-emerald-700">Lengkap</span>
                                    ) : (
                                        <span className="text-neutral-400">Tidak Ada</span>
                                    )}
                                </td>
                                <td className="py-2 px-3 text-neutral-600">Diserahkan bersama fisik unit kendaraan</td>
                            </tr>
                            <tr>
                                <td className="py-2 px-3 text-neutral-500">4</td>
                                <td className="py-2 px-3 font-medium">BPKB Asli & Faktur Pembelian</td>
                                <td className="py-2 px-3 text-center">
                                    {handover?.bpkb_delivered_at ? (
                                        <span className="font-bold text-emerald-700">Diserahkan</span>
                                    ) : (
                                        <span className="font-bold text-amber-700">Ditahan</span>
                                    )}
                                </td>
                                <td className="py-2 px-3 text-neutral-600">
                                    {handover?.bpkb_delivered_at
                                        ? `Diserahkan pada ${formatIndonesianDateTime(handover.bpkb_delivered_at)} (${handover.bpkb_recipient_type === 'finance_company' ? 'Ke Finance Leasing' : 'Ke Customer'})`
                                        : remainingBill > 0
                                          ? `Ditahan di Showroom (Belum lunas, sisa Rp ${remainingBill.toLocaleString('id-ID')})`
                                          : 'Siap diserahkan (Lunas 100%)'}
                                </td>
                            </tr>
                            <tr>
                                <td className="py-2 px-3 text-neutral-500">5</td>
                                <td className="py-2 px-3 font-medium">Tool Kit, Dongkrak & Ban Cadangan</td>
                                <td className="py-2 px-3 text-center font-bold text-emerald-700">
                                    {checklist?.has_toolkit !== false ? 'Lengkap' : '—'}
                                </td>
                                <td className="py-2 px-3 text-neutral-600">Terpasang dan tersimpan rapi di bagasi unit</td>
                            </tr>
                            <tr>
                                <td className="py-2 px-3 text-neutral-500">6</td>
                                <td className="py-2 px-3 font-medium">Buku Manual / Buku Servis</td>
                                <td className="py-2 px-3 text-center font-bold text-neutral-700">
                                    {checklist?.has_manual_book !== false ? 'Lengkap' : '—'}
                                </td>
                                <td className="py-2 px-3 text-neutral-600">Buku panduan pemilik kendaraan</td>
                            </tr>
                            <tr>
                                <td className="py-2 px-3 text-neutral-500">7</td>
                                <td className="py-2 px-3 font-medium">Kondisi BBM & Kebersihan Unit</td>
                                <td className="py-2 px-3 text-center font-bold text-neutral-700">
                                    {checklist?.fuel_level ?? '1/2'}
                                </td>
                                <td className="py-2 px-3 text-neutral-600">
                                    {checklist?.cleanliness ?? 'Bersih & Salon Siap Pakai'}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Catatan Khusus */}
                {handover?.notes && (
                    <div className="rounded-lg border border-neutral-200 p-3 mb-6 bg-neutral-50 text-xs">
                        <div className="font-bold text-neutral-900 mb-1">Catatan Tambahan:</div>
                        <p className="text-neutral-700 italic">{handover.notes}</p>
                    </div>
                )}

                {/* Pernyataan Hukum */}
                <div className="text-[11px] leading-relaxed text-neutral-600 mb-8 border-t border-neutral-200 pt-3">
                    <p className="font-semibold text-neutral-800 mb-1">Ketentuan & Pernyataan Serah Terima:</p>
                    <ol className="list-decimal pl-4 space-y-0.5">
                        <li>Pihak Kedua telah memeriksa kondisi fisik dan kelengkapan kendaraan di atas dan menyatakan menerima dalam keadaan baik.</li>
                        <li>Segala tanggung jawab pemakaian, perawatan, serta risiko hukum dan lalu lintas atas kendaraan beralih kepada Pihak Kedua sejak tanggal dan jam penyerahan ini.</li>
                        <li>BPKB asli akan diserahkan penuh kepada Pihak Kedua / Lembaga Pembiayaan terkait setelah kewajiban pembayaran dinyatakan lunas 100% oleh Showroom Telaga Berlian.</li>
                    </ol>
                </div>

                {/* Kolom Tanda Tangan */}
                <div className="grid grid-cols-3 gap-4 text-center text-xs pt-4">
                    <div>
                        <p className="text-neutral-600 mb-16">Pihak Pertama (Showroom),</p>
                        <p className="font-bold text-neutral-900 underline underline-offset-4">
                            ({handover?.officer_name ?? 'Staf Showroom'})
                        </p>
                        <p className="text-[10px] text-neutral-500 mt-0.5">Telaga Berlian Motor</p>
                    </div>

                    <div>
                        <p className="text-neutral-600 mb-4">Materai Rp 10.000</p>
                        <div className="mx-auto w-24 h-12 border border-dashed border-neutral-300 rounded flex items-center justify-center text-[10px] text-neutral-400 mb-2">
                            Materai
                        </div>
                        <p className="font-bold text-neutral-900 underline underline-offset-4">
                            ({handover?.recipient_name ?? sale.customer?.name ?? 'Penerima / Pembeli'})
                        </p>
                        <p className="text-[10px] text-neutral-500 mt-0.5">Pihak Kedua (Penerima)</p>
                    </div>

                    <div>
                        <p className="text-neutral-600 mb-16">Mengetahui,</p>
                        <p className="font-bold text-neutral-900 underline underline-offset-4">
                            (Pimpinan Showroom)
                        </p>
                        <p className="text-[10px] text-neutral-500 mt-0.5">Telaga Berlian Motor</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

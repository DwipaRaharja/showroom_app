import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeftIcon,
    CheckIcon,
    PrinterIcon,
    XIcon,
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import type {
    HandoverChecklist,
    Sale,
    VehicleHandover,
} from '@/pages/sales/types';
import { show as salesShow } from '@/routes/sales';

type Props = {
    sale: Sale;
    handover: VehicleHandover;
};

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Makassar',
});

const timeFormatter = new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: 'Asia/Makassar',
});

function formatDateTime(value: string | null): string {
    if (!value) {
        return '—';
    }

    const date = new Date(value);

    return `${dateFormatter.format(date)}, pukul ${timeFormatter.format(date)} WITA`;
}

function relationLabel(
    relation: string | null | undefined,
): string {
    if (!relation) return '—';
    const labels: Record<string, string> = {
        buyer_self: 'Pembeli sendiri',
        family: 'Keluarga / pasangan',
        driver: 'Supir / utusan',
        leasing_officer: 'Petugas perusahaan pembiayaan',
        other: 'Lainnya',
    };

    return labels[relation] ?? relation;
}

function ChecklistStatus({ checked }: { checked: boolean }) {
    return checked ? (
        <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
            <CheckIcon className="size-3.5" weight="bold" /> Ada
        </span>
    ) : (
        <span className="inline-flex items-center gap-1 text-neutral-500">
            <XIcon className="size-3.5" /> Tidak ada
        </span>
    );
}

function DetailRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="grid grid-cols-[7rem_1fr] gap-2 py-0.5">
            <span className="text-neutral-500">{label}</span>
            <span className="font-medium text-neutral-900">
                : {value || '—'}
            </span>
        </div>
    );
}

function checklistRows(checklist: HandoverChecklist) {
    return [
        ['STNK asli', checklist.has_stnk ?? false],
        ['Buku manual / servis', checklist.has_manual_book ?? false],
        ['Tool kit & dongkrak', checklist.has_toolkit ?? false],
        ['Ban cadangan', checklist.has_spare_tire ?? false],
    ] as const;
}

export default function BastPrint({ sale, handover }: Props) {
    const checklist = handover.checklist ?? {};
    const bpkbDelivered = Boolean(handover.bpkb_delivered_at);

    return (
        <div className="min-h-screen bg-neutral-100 px-4 py-6 text-neutral-900 print:bg-white print:p-0">
            <Head title={`BAST ${handover.handover_number}`} />
            <style>{`
                @page { size: A4 portrait; margin: 12mm; }
                @media print {
                    html, body { background: white !important; }
                    * { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
                }
            `}</style>

            <div className="mx-auto mb-4 flex max-w-[210mm] items-center justify-between print:hidden">
                <Button variant="outline" size="sm" asChild>
                    <Link href={salesShow(sale.id)}>
                        <ArrowLeftIcon />
                        Kembali
                    </Link>
                </Button>
                <Button size="sm" onClick={() => window.print()}>
                    <PrinterIcon />
                    Cetak BAST
                </Button>
            </div>

            <main className="mx-auto max-w-[210mm] bg-white p-8 shadow-sm ring-1 ring-neutral-200 print:max-w-none print:p-0 print:shadow-none print:ring-0">
                <header className="flex items-start justify-between gap-6 border-b-2 border-neutral-900 pb-4">
                    <div>
                        <p className="text-xl font-black tracking-tight">
                            TELAGA BERLIAN MOTOR
                        </p>
                        <p className="mt-1 text-[11px] text-neutral-500">
                            Dokumen resmi penyerahan kendaraan
                        </p>
                    </div>
                    <div className="text-right text-[11px]">
                        <p className="text-neutral-500">Nomor BAST</p>
                        <p className="font-mono text-sm font-bold">
                            {handover.handover_number}
                        </p>
                        <p className="mt-1 font-mono text-neutral-500">
                            Ref. {sale.invoice_number}
                        </p>
                    </div>
                </header>

                <section className="py-5 text-center">
                    <h1 className="text-base font-bold tracking-wide uppercase underline underline-offset-4">
                        Berita Acara Serah Terima Kendaraan
                    </h1>
                    <p className="mt-2 text-xs text-neutral-600">
                        {formatDateTime(handover.vehicle_delivered_at)}
                    </p>
                </section>

                <p className="mb-5 text-xs leading-5 text-neutral-700">
                    Pada waktu tersebut di atas, bertempat di{' '}
                    <strong>{handover.handover_location}</strong>
                    {handover.handover_address
                        ? `, ${handover.handover_address}`
                        : ''}
                    , telah dilakukan penyerahan kendaraan dari pihak showroom
                    kepada pihak penerima dengan rincian berikut.
                </p>

                <section className="mb-5 grid gap-4 text-xs sm:grid-cols-2 print:grid-cols-2">
                    <div className="break-inside-avoid rounded-lg border border-neutral-200 p-3.5">
                        <h2 className="mb-2 border-b border-neutral-200 pb-2 text-[11px] font-bold uppercase">
                            Pihak yang menyerahkan
                        </h2>
                        <DetailRow label="Nama" value={handover.officer_name ?? '—'} />
                        <DetailRow
                            label="Instansi"
                            value="Telaga Berlian Motor"
                        />
                    </div>
                    <div className="break-inside-avoid rounded-lg border border-neutral-200 p-3.5">
                        <h2 className="mb-2 border-b border-neutral-200 pb-2 text-[11px] font-bold uppercase">
                            Pihak yang menerima
                        </h2>
                        <DetailRow
                            label="Nama"
                            value={handover.recipient_name ?? '—'}
                        />
                        <DetailRow
                            label="NIK"
                            value={handover.recipient_id_card ?? '—'}
                        />
                        <DetailRow
                            label="No. HP"
                            value={handover.recipient_phone ?? '—'}
                        />
                        <DetailRow
                            label="Hubungan"
                            value={relationLabel(handover.recipient_relation)}
                        />
                    </div>
                </section>

                <section className="mb-5 break-inside-avoid overflow-hidden rounded-lg border border-neutral-200 text-xs">
                    <h2 className="border-b border-neutral-200 bg-neutral-100 px-3.5 py-2 text-[11px] font-bold uppercase">
                        Identitas kendaraan
                    </h2>
                    <div className="grid gap-x-8 gap-y-1 p-3.5 sm:grid-cols-2 print:grid-cols-2">
                        <DetailRow
                            label="Merek / tipe"
                            value={`${sale.car?.brand?.name ?? ''} ${sale.car?.name ?? ''}`.trim()}
                        />
                        <DetailRow
                            label="Nomor polisi"
                            value={sale.car?.license_plate ?? '—'}
                        />
                        <DetailRow
                            label="Nomor rangka"
                            value={sale.car?.chassis_number ?? '—'}
                        />
                        <DetailRow
                            label="Nomor mesin"
                            value={sale.car?.engine_number ?? '—'}
                        />
                        <DetailRow
                            label="Tahun / warna"
                            value={`${sale.car?.year ?? '—'} / ${sale.car?.color ?? '—'}`}
                        />
                        <DetailRow
                            label="Odometer"
                            value={`${(sale.car?.mileage ?? 0).toLocaleString('id-ID')} km`}
                        />
                    </div>
                </section>

                <section className="mb-5 break-inside-avoid overflow-hidden rounded-lg border border-neutral-200 text-xs">
                    <h2 className="border-b border-neutral-200 bg-neutral-100 px-3.5 py-2 text-[11px] font-bold uppercase">
                        Kelengkapan yang diserahkan bersama unit
                    </h2>
                    <table className="w-full">
                        <thead className="border-b border-neutral-200 text-left text-[11px] text-neutral-500">
                            <tr>
                                <th className="px-3 py-2">Kelengkapan</th>
                                <th className="w-32 px-3 py-2">Status</th>
                                <th className="px-3 py-2">Keterangan</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200">
                            {checklistRows(checklist).map(
                                ([label, checked]) => (
                                    <tr key={label}>
                                        <td className="px-3 py-2 font-medium">
                                            {label}
                                        </td>
                                        <td className="px-3 py-2">
                                            <ChecklistStatus
                                                checked={checked}
                                            />
                                        </td>
                                        <td className="px-3 py-2 text-neutral-500">
                                            —
                                        </td>
                                    </tr>
                                ),
                            )}
                            <tr>
                                <td className="px-3 py-2 font-medium">
                                    Kunci kendaraan
                                </td>
                                <td className="px-3 py-2 font-semibold">
                                    {checklist.key_count ?? 0} buah
                                </td>
                                <td className="px-3 py-2 text-neutral-500">
                                    —
                                </td>
                            </tr>
                            <tr>
                                <td className="px-3 py-2 font-medium">
                                    BBM & kebersihan
                                </td>
                                <td className="px-3 py-2 font-semibold">
                                    {checklist.fuel_level ?? '—'}
                                </td>
                                <td className="px-3 py-2 text-neutral-600">
                                    {checklist.cleanliness ?? '—'}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </section>

                <section className="mb-5 break-inside-avoid rounded-lg border border-neutral-200 p-3.5 text-xs">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h2 className="font-bold">
                                Status BPKB & Faktur Asli
                            </h2>
                            <p className="mt-1 text-neutral-600">
                                {bpkbDelivered && handover.bpkb_delivered_at
                                    ? `Diserahkan pada ${formatDateTime(handover.bpkb_delivered_at)} kepada ${
                                          handover.bpkb_recipient_type ===
                                          'finance_company'
                                              ? 'perusahaan pembiayaan'
                                              : 'customer'
                                      }.`
                                    : 'Belum diserahkan dan tetap disimpan oleh showroom sampai proses penyerahan BPKB dicatat.'}
                            </p>
                        </div>
                        <span
                            className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                bpkbDelivered
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                            }`}
                        >
                            {bpkbDelivered
                                ? 'Sudah diserahkan'
                                : 'Ditahan showroom'}
                        </span>
                    </div>
                </section>

                {handover.notes && (
                    <section className="mb-5 break-inside-avoid rounded-lg border border-neutral-200 p-3.5 text-xs">
                        <h2 className="font-bold">Catatan</h2>
                        <p className="mt-1 whitespace-pre-wrap text-neutral-600">
                            {handover.notes}
                        </p>
                    </section>
                )}

                <section className="mb-8 break-inside-avoid border-t border-neutral-200 pt-3 text-[11px] leading-5 text-neutral-600">
                    <p className="font-semibold text-neutral-900">Pernyataan</p>
                    <ol className="list-decimal space-y-0.5 pl-4">
                        <li>
                            Penerima telah memeriksa kendaraan dan kelengkapan
                            yang tercantum pada dokumen ini.
                        </li>
                        <li>
                            Tanggung jawab penggunaan kendaraan beralih kepada
                            penerima sejak waktu penyerahan yang tercatat.
                        </li>
                        <li>
                            Status penyerahan BPKB mengikuti keterangan pada
                            bagian BPKB & Faktur Asli di atas.
                        </li>
                    </ol>
                </section>

                <section className="grid break-inside-avoid grid-cols-2 gap-12 pt-2 text-center text-xs">
                    <div>
                        <p className="mb-16 text-neutral-600">
                            Yang menyerahkan,
                        </p>
                        <p className="font-bold underline underline-offset-4">
                            {handover.officer_name}
                        </p>
                        <p className="mt-1 text-[10px] text-neutral-500">
                            Telaga Berlian Motor
                        </p>
                    </div>
                    <div>
                        <p className="mb-16 text-neutral-600">Yang menerima,</p>
                        <p className="font-bold underline underline-offset-4">
                            {handover.recipient_name}
                        </p>
                        <p className="mt-1 text-[10px] text-neutral-500">
                            {relationLabel(handover.recipient_relation)}
                        </p>
                    </div>
                </section>

                <footer className="mt-8 border-t border-neutral-200 pt-2 text-center text-[9px] text-neutral-400">
                    {handover.handover_number} · {sale.invoice_number}
                </footer>
            </main>
        </div>
    );
}

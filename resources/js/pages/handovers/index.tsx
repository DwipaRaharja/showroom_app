import { Head } from '@inertiajs/react';
import {
    CheckCircleIcon,
    KeyIcon,
    LockIcon,
    MagnifyingGlassIcon,
    ShieldCheckIcon,
} from '@phosphor-icons/react';
import { useCallback, useState } from 'react';
import { StatCard } from '@/components/stat-card';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { HandoverDataTable } from '@/pages/handovers/data-table';
import { HandoverDialog } from '@/pages/sales/handover-dialog';
import type { Sale } from '@/pages/sales/types';
import { index as handoversIndex } from '@/routes/handovers';

type Props = {
    sales: Sale[];
    summary: {
        total_sales: number;
        ready_to_deliver: number;
        vehicle_delivered: number;
        fully_completed: number;
        locked: number;
    };
};

function saleLabel(sale: Sale): string {
    return [
        sale.invoice_number,
        sale.car?.license_plate ?? 'Tanpa plat',
        sale.customer?.name ?? 'Tanpa customer',
    ].join(' · ');
}

function saleSearchText(sale: Sale): string {
    return [
        sale.invoice_number,
        sale.car?.brand?.name,
        sale.car?.name,
        sale.car?.license_plate,
        sale.car?.chassis_number,
        sale.customer?.name,
        sale.customer?.phone,
    ]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase('id-ID');
}

export default function HandoversIndex({ sales, summary }: Props) {
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSalePickerOpen, setIsSalePickerOpen] = useState(false);
    const [pendingSaleId, setPendingSaleId] = useState('');
    const [saleSearch, setSaleSearch] = useState('');
    const pendingSale = sales.find((sale) => String(sale.id) === pendingSaleId);
    const normalizedSaleSearch = saleSearch.trim().toLocaleLowerCase('id-ID');
    const filteredSales = normalizedSaleSearch
        ? sales.filter((sale) =>
              saleSearchText(sale).includes(normalizedSaleSearch),
          )
        : [];

    const handleManageHandover = useCallback((sale: Sale) => {
        setSelectedSale(sale);
        setIsDialogOpen(true);
    }, []);

    function openSalePicker() {
        setPendingSaleId('');
        setSaleSearch('');
        setIsSalePickerOpen(true);
    }

    function continueToHandover() {
        if (!pendingSale) {
            return;
        }

        setIsSalePickerOpen(false);
        handleManageHandover(pendingSale);
    }

    return (
        <>
            <Head title="Penyerahan Unit" />

            <div className="flex h-full min-w-0 flex-1 flex-col gap-6 p-4 md:p-6">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Penyerahan Unit
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Pantau setiap kejadian penyerahan, penerima, barang,
                        petugas, dan bukti foto.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        title="Siap Serah Unit (≤ 10jt)"
                        value={summary.ready_to_deliver}
                        icon={KeyIcon}
                        variant="success"
                    />
                    <StatCard
                        title="Unit Diserahkan (BPKB Tahan)"
                        value={summary.vehicle_delivered}
                        icon={CheckCircleIcon}
                        variant="warning"
                    />
                    <StatCard
                        title="Selesai Lengkap (Lunas)"
                        value={summary.fully_completed}
                        icon={ShieldCheckIcon}
                        variant="info"
                    />
                    <StatCard
                        title="Belum Boleh Serah (> 10jt)"
                        value={summary.locked}
                        icon={LockIcon}
                        variant="danger"
                    />
                </div>

                <HandoverDataTable
                    sales={sales}
                    onManageHandover={handleManageHandover}
                    onAddHandover={openSalePicker}
                />
            </div>

            <Dialog open={isSalePickerOpen} onOpenChange={setIsSalePickerOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Tambah Penyerahan</DialogTitle>
                        <DialogDescription>
                            Pilih transaksi terlebih dahulu. Data penerima akan
                            diisi khusus untuk kejadian penyerahan yang baru.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-2">
                        <div className="grid gap-1.5">
                            <span className="text-sm font-medium">
                                Transaksi penjualan
                            </span>
                            <div className="relative">
                                <MagnifyingGlassIcon
                                    aria-hidden="true"
                                    className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                                />
                                <Input
                                    autoFocus
                                    type="search"
                                    value={saleSearch}
                                    onChange={(event) => {
                                        setSaleSearch(event.target.value);
                                        setPendingSaleId('');
                                    }}
                                    placeholder="Cari invoice, mobil, plat, atau customer..."
                                    className="pl-9"
                                />
                            </div>

                            <div className="mt-1 max-h-72 overflow-y-auto rounded-lg border bg-background">
                                {!normalizedSaleSearch ? (
                                    <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                                        Ketik invoice, nama atau plat mobil,
                                        maupun nama customer untuk mulai
                                        mencari.
                                    </p>
                                ) : filteredSales.length === 0 ? (
                                    <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                                        Tidak ada transaksi yang cocok dengan “
                                        {saleSearch.trim()}”.
                                    </p>
                                ) : (
                                    filteredSales.map((sale) => {
                                        const isSelected =
                                            pendingSaleId === String(sale.id);

                                        return (
                                            <button
                                                key={sale.id}
                                                type="button"
                                                aria-label={`Pilih ${saleLabel(sale)}`}
                                                aria-pressed={isSelected}
                                                onClick={() =>
                                                    setPendingSaleId(
                                                        String(sale.id),
                                                    )
                                                }
                                                className={cn(
                                                    'flex w-full items-start gap-3 border-b px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none',
                                                    isSelected &&
                                                        'bg-primary/5 hover:bg-primary/10',
                                                )}
                                            >
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="font-semibold">
                                                            {
                                                                sale.invoice_number
                                                            }
                                                        </span>
                                                        {isSelected && (
                                                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                                                                Dipilih
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="mt-1 text-sm">
                                                        {[
                                                            sale.car?.brand
                                                                ?.name,
                                                            sale.car?.name,
                                                        ]
                                                            .filter(Boolean)
                                                            .join(' ') ||
                                                            'Unit tidak tersedia'}
                                                        {' · '}
                                                        {sale.car
                                                            ?.license_plate ??
                                                            'Tanpa plat'}
                                                    </p>
                                                    <p className="mt-0.5 text-sm text-muted-foreground">
                                                        Customer:{' '}
                                                        {sale.customer?.name ??
                                                            '—'}
                                                        {sale.customer?.phone
                                                            ? ` · ${sale.customer.phone}`
                                                            : ''}
                                                    </p>
                                                </div>

                                                {isSelected && (
                                                    <CheckCircleIcon
                                                        aria-hidden="true"
                                                        weight="fill"
                                                        className="mt-0.5 size-5 text-primary"
                                                    />
                                                )}
                                            </button>
                                        );
                                    })
                                )}
                            </div>

                            {normalizedSaleSearch &&
                                filteredSales.length > 0 && (
                                    <span className="text-xs text-muted-foreground">
                                        {filteredSales.length} transaksi
                                        ditemukan. Klik salah satu data untuk
                                        memilih.
                                    </span>
                                )}
                        </div>

                        {pendingSale && (
                            <div className="grid gap-1 rounded-lg border bg-muted/30 p-3 text-sm">
                                <span className="font-semibold">
                                    {pendingSale.car?.brand?.name}{' '}
                                    {pendingSale.car?.name}
                                </span>
                                <span className="text-muted-foreground">
                                    Pembeli: {pendingSale.customer?.name ?? '—'}
                                </span>
                                <span className="text-muted-foreground">
                                    Riwayat sebelumnya:{' '}
                                    {pendingSale.handover?.events.length ?? 0}{' '}
                                    kejadian
                                </span>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsSalePickerOpen(false)}
                        >
                            Batal
                        </Button>
                        <Button
                            type="button"
                            onClick={continueToHandover}
                            disabled={!pendingSale}
                        >
                            Lanjut isi penyerahan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {selectedSale && (
                <HandoverDialog
                    key={`${selectedSale.id}-${selectedSale.handover?.updated_at ?? 'new'}`}
                    open={isDialogOpen}
                    sale={selectedSale}
                    onOpenChange={(open: boolean) => {
                        setIsDialogOpen(open);

                        if (!open) {
                            setSelectedSale(null);
                        }
                    }}
                />
            )}
        </>
    );
}

HandoversIndex.layout = {
    breadcrumbs: [
        {
            title: 'Penyerahan Unit',
            href: handoversIndex.url(),
        },
    ],
};

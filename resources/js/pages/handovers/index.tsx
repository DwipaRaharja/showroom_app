import { Head } from '@inertiajs/react';
import {
    CheckCircleIcon,
    KeyIcon,
    LockIcon,
    PlusIcon,
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
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

export default function HandoversIndex({ sales, summary }: Props) {
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSalePickerOpen, setIsSalePickerOpen] = useState(false);
    const [pendingSaleId, setPendingSaleId] = useState('');
    const pendingSale = sales.find((sale) => String(sale.id) === pendingSaleId);

    const handleManageHandover = useCallback((sale: Sale) => {
        setSelectedSale(sale);
        setIsDialogOpen(true);
    }, []);

    function openSalePicker() {
        setPendingSaleId('');
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
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Penyerahan Unit
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Pantau setiap kejadian penyerahan, penerima, barang,
                            petugas, dan bukti foto.
                        </p>
                    </div>
                    <Button
                        onClick={openSalePicker}
                        disabled={sales.length === 0}
                    >
                        <PlusIcon className="size-4" />
                        Tambah Penyerahan
                    </Button>
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
                />
            </div>

            <Dialog open={isSalePickerOpen} onOpenChange={setIsSalePickerOpen}>
                <DialogContent className="sm:max-w-xl">
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
                            <Select
                                value={pendingSaleId}
                                onValueChange={setPendingSaleId}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Pilih invoice, unit, atau customer" />
                                </SelectTrigger>
                                <SelectContent>
                                    {sales.map((sale) => (
                                        <SelectItem
                                            key={sale.id}
                                            value={String(sale.id)}
                                        >
                                            {saleLabel(sale)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
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

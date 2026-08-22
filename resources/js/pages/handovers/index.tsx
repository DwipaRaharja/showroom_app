import { Head } from '@inertiajs/react';
import {
    CheckCircleIcon,
    KeyIcon,
    LockIcon,
    ShieldCheckIcon,
} from '@phosphor-icons/react';
import { useCallback, useState } from 'react';
import { Card } from '@/components/ui/card';
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

export default function HandoversIndex({ sales, summary }: Props) {
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const handleManageHandover = useCallback((sale: Sale) => {
        setSelectedSale(sale);
        setIsDialogOpen(true);
    }, []);

    return (
        <>
            <Head title="Penyerahan Unit" />

            <div className="flex h-full min-w-0 flex-1 flex-col gap-6 p-4 md:p-6">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Penyerahan Unit
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Pantau penyerahan unit dan BPKB untuk{' '}
                        {summary.total_sales} transaksi penjualan aktif.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="flex flex-row items-center gap-3 p-4 shadow-xs">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                            <KeyIcon className="size-5" weight="bold" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-foreground">
                                {summary.ready_to_deliver}
                            </div>
                            <div className="text-xs font-medium text-muted-foreground">
                                Siap diserahkan
                            </div>
                        </div>
                    </Card>

                    <Card className="flex flex-row items-center gap-3 p-4 shadow-xs">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
                            <CheckCircleIcon className="size-5" weight="bold" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-foreground">
                                {summary.vehicle_delivered}
                            </div>
                            <div className="text-xs font-medium text-muted-foreground">
                                Menunggu BPKB
                            </div>
                        </div>
                    </Card>

                    <Card className="flex flex-row items-center gap-3 p-4 shadow-xs">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
                            <ShieldCheckIcon className="size-5" weight="bold" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-foreground">
                                {summary.fully_completed}
                            </div>
                            <div className="text-xs font-medium text-muted-foreground">
                                Selesai lengkap
                            </div>
                        </div>
                    </Card>

                    <Card className="flex flex-row items-center gap-3 p-4 shadow-xs">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-600">
                            <LockIcon className="size-5" weight="bold" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-foreground">
                                {summary.locked}
                            </div>
                            <div className="text-xs font-medium text-muted-foreground">
                                Menunggu pembayaran
                            </div>
                        </div>
                    </Card>
                </div>

                <HandoverDataTable
                    sales={sales}
                    onManageHandover={handleManageHandover}
                />
            </div>

            {selectedSale && (
                <HandoverDialog
                    key={`${selectedSale.id}-${selectedSale.handover?.updated_at ?? 'new'}`}
                    open={isDialogOpen}
                    sale={selectedSale}
                    onOpenChange={(open) => {
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

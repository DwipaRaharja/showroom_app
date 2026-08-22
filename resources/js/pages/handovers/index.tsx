import { Head } from '@inertiajs/react';
import {
    CarProfileIcon,
    CheckCircleIcon,
    KeyIcon,
    LockIcon,
    ShieldCheckIcon,
} from '@phosphor-icons/react';
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { HandoverDataTable } from '@/pages/handovers/data-table';
import { HandoverDialog } from '@/pages/sales/handover-dialog';
import type { Sale } from '@/pages/sales/types';

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

    function handleManageHandover(sale: Sale) {
        setSelectedSale(sale);
        setIsDialogOpen(true);
    }

    return (
        <>
            <Head title="Penyerahan Unit Kendaraan & BAST" />

            <div className="flex h-full min-w-0 flex-1 flex-col gap-6 p-4 md:p-6">
                {/* Header */}
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-foreground">
                            Penyerahan Unit & BAST
                        </h1>
                        <p className="text-xs text-muted-foreground">
                            Monitoring serah terima fisik kendaraan, kelengkapan surat, dan status penyerahan BPKB.
                        </p>
                    </div>
                </div>

                {/* 4 Summary KPI Cards */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="flex items-center gap-3 p-4 shadow-xs">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                            <KeyIcon className="size-5" weight="bold" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-foreground">
                                {summary.ready_to_deliver}
                            </div>
                            <div className="text-xs font-medium text-muted-foreground">
                                Siap Serah Unit (≤ 10jt)
                            </div>
                        </div>
                    </Card>

                    <Card className="flex items-center gap-3 p-4 shadow-xs">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
                            <CheckCircleIcon className="size-5" weight="bold" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-foreground">
                                {summary.vehicle_delivered}
                            </div>
                            <div className="text-xs font-medium text-muted-foreground">
                                Unit Diserahkan (BPKB Tahan)
                            </div>
                        </div>
                    </Card>

                    <Card className="flex items-center gap-3 p-4 shadow-xs">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
                            <ShieldCheckIcon className="size-5" weight="bold" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-foreground">
                                {summary.fully_completed}
                            </div>
                            <div className="text-xs font-medium text-muted-foreground">
                                Selesai Lengkap (Lunas)
                            </div>
                        </div>
                    </Card>

                    <Card className="flex items-center gap-3 p-4 shadow-xs">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-600">
                            <LockIcon className="size-5" weight="bold" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-foreground">
                                {summary.locked}
                            </div>
                            <div className="text-xs font-medium text-muted-foreground">
                                Belum Boleh Serah (&gt; 10jt)
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Data Table */}
                <HandoverDataTable
                    sales={sales}
                    onManageHandover={handleManageHandover}
                />
            </div>

            {/* Handover Dialog */}
            {selectedSale && (
                <HandoverDialog
                    open={isDialogOpen}
                    sale={selectedSale}
                    onOpenChange={(open) => {
                        setIsDialogOpen(open);
                        if (!open) setSelectedSale(null);
                    }}
                />
            )}
        </>
    );
}

HandoversIndex.layout = {
    breadcrumbs: [
        {
            title: 'Penyerahan Unit & BAST',
            href: '#',
        },
    ],
};

import { Head } from '@inertiajs/react';
import {
    CheckCircleIcon,
    KeyIcon,
    LockIcon,
    ShieldCheckIcon,
} from '@phosphor-icons/react';
import { StatCard } from '@/components/stat-card';
import { HandoverDataTable } from '@/pages/handovers/data-table';
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
    return (
        <>
            <Head title="Penyerahan Unit" />

            <div className="flex h-full min-w-0 flex-1 flex-col gap-6 p-4 md:p-6">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Penyerahan Unit
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Setiap penjualan otomatis ditampilkan satu kali dengan
                        ringkasan seluruh tracking, penerima, barang, dan bukti
                        foto.
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

                <HandoverDataTable sales={sales} />
            </div>
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

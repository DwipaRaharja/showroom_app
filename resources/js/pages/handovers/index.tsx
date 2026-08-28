import { Head } from '@inertiajs/react';
import {
    CheckCircleIcon,
    KeyIcon,
    LockIcon,
    ShieldCheckIcon,
} from '@phosphor-icons/react';
import { PageContainer } from '@/components/page-container';
import { PageHeader } from '@/components/page-header';
import { StatCard } from '@/components/stat-card';
import { StatCardGrid } from '@/components/stat-card-grid';
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

            <PageContainer>
                <PageHeader
                    title="Penyerahan Unit"
                    description="Setiap penjualan otomatis ditampilkan satu kali dengan ringkasan seluruh tracking, penerima, barang, dan bukti foto."
                />

                <StatCardGrid>
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
                </StatCardGrid>

                <HandoverDataTable sales={sales} />
            </PageContainer>
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

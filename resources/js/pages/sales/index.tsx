import { Head } from '@inertiajs/react';
import { PageContainer } from '@/components/page-container';
import { PageHeader } from '@/components/page-header';
import { SaleDataTable } from '@/pages/sales/data-table';
import type { Sale, SalesSummary } from '@/pages/sales/types';
import { index as salesIndex } from '@/routes/sales';

type Props = {
    sales: Sale[];
    summary: SalesSummary;
};

export default function SalesIndex({ sales, summary }: Props) {
    return (
        <>
            <Head title="Penjualan Mobil" />

            <PageContainer>
                <PageHeader
                    title="Penjualan Mobil"
                    description="Kelola seluruh transaksi penjualan showroom (Tunai Lunas, Tempo, Kredit Leasing, dan Tukar Tambah) serta pantau riwayat pelunasan dan piutang."
                />

                <SaleDataTable data={sales} summary={summary} />
            </PageContainer>
        </>
    );
}

SalesIndex.layout = {
    breadcrumbs: [
        {
            title: 'Penjualan',
            href: salesIndex.url(),
        },
    ],
};

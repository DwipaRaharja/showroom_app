import { Head } from '@inertiajs/react';
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

            <div className="flex h-full min-w-0 flex-1 flex-col gap-6 p-4 md:p-6">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Penjualan Mobil
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Kelola seluruh transaksi penjualan showroom (Tunai Lunas, Tempo, & Kredit Leasing) serta pantau riwayat pelunasan dan piutang.
                    </p>
                </div>

                <SaleDataTable data={sales} summary={summary} />
            </div>
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

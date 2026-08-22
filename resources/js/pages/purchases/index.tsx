import { Head } from '@inertiajs/react';
import { PurchaseDataTable } from '@/pages/purchases/data-table';
import type { Purchase } from '@/pages/purchases/types';
import { index as purchasesIndex } from '@/routes/purchases';

type Props = {
    purchases: Purchase[];
};

export default function PurchasesIndex({ purchases }: Props) {
    return (
        <>
            <Head title="Modal Mobil" />

            <div className="flex h-full min-w-0 flex-1 flex-col gap-6 p-4 md:p-6">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Modal Mobil
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Kelola harga perolehan dan seluruh biaya modal setiap
                        unit mobil showroom.
                    </p>
                </div>

                <PurchaseDataTable data={purchases} />
            </div>
        </>
    );
}

PurchasesIndex.layout = {
    breadcrumbs: [
        {
            title: 'Modal Mobil',
            href: purchasesIndex.url(),
        },
    ],
};

import { Head } from '@inertiajs/react';
import { PurchaseForm } from '@/pages/purchases/purchase-form';
import type { PurchaseCar, PurchaseFormValue } from '@/pages/purchases/types';
import { index as purchasesIndex } from '@/routes/purchases';

type Props = {
    purchase: PurchaseFormValue;
    cars: PurchaseCar[];
};

export default function PurchasesEdit({ purchase, cars }: Props) {
    return (
        <>
            <Head title={`Edit ${purchase.purchase_number}`} />

            <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 md:p-6">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Edit modal mobil
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Perbarui rincian modal {purchase.purchase_number}.
                    </p>
                </div>

                <PurchaseForm purchase={purchase} cars={cars} />
            </div>
        </>
    );
}

PurchasesEdit.layout = {
    breadcrumbs: [
        {
            title: 'Modal Mobil',
            href: purchasesIndex.url(),
        },
        {
            title: 'Edit Modal',
            href: purchasesIndex.url(),
        },
    ],
};

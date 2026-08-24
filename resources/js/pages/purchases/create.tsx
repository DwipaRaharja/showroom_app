import { Head } from '@inertiajs/react';
import { PurchaseForm } from '@/pages/purchases/purchase-form';
import type { PurchaseCar } from '@/pages/purchases/types';
import {
    create as purchasesCreate,
    index as purchasesIndex,
} from '@/routes/purchases';

type Props = {
    cars: PurchaseCar[];
    selected_car_id: number | null;
};

export default function PurchasesCreate({ cars, selected_car_id }: Props) {
    return (
        <>
            <Head title="Tambah Modal Mobil" />

            <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 md:p-6">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Tambah modal mobil
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Masukkan harga perolehan dan seluruh biaya yang
                        membentuk modal kendaraan.
                    </p>
                </div>

                <PurchaseForm
                    purchase={null}
                    cars={cars}
                    selectedCarId={selected_car_id}
                />
            </div>
        </>
    );
}

PurchasesCreate.layout = {
    breadcrumbs: [
        {
            title: 'Modal Mobil',
            href: purchasesIndex.url(),
        },
        {
            title: 'Tambah Modal',
            href: purchasesCreate.url(),
        },
    ],
};

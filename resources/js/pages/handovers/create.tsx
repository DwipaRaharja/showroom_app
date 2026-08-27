import { Head } from '@inertiajs/react';
import VehicleHandoverController from '@/actions/App/Http/Controllers/VehicleHandoverController';
import { HandoverForm } from '@/pages/handovers/handover-form';
import type { Sale } from '@/pages/sales/types';

type Props = {
    sale: Sale;
};

export default function HandoverCreate({ sale }: Props) {
    const carName = [sale.car?.brand?.name, sale.car?.name]
        .filter(Boolean)
        .join(' ');

    return (
        <>
            <Head title={`Tambah Tracking ${sale.invoice_number}`} />

            <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 md:p-6">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Tambah tracking penyerahan
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {sale.invoice_number} · {carName} ·{' '}
                        {sale.car?.license_plate ?? 'Tanpa plat'}
                    </p>
                </div>

                <HandoverForm sale={sale} />
            </div>
        </>
    );
}

HandoverCreate.layout = {
    breadcrumbs: [
        {
            title: 'Penyerahan Unit',
            href: VehicleHandoverController.index.url(),
        },
        {
            title: 'Tambah Tracking',
        },
    ],
};

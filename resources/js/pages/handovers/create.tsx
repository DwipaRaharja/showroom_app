import { Head } from '@inertiajs/react';
import VehicleHandoverController from '@/actions/App/Http/Controllers/VehicleHandoverController';
import { PageContainer } from '@/components/page-container';
import { PageHeader } from '@/components/page-header';
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

            <PageContainer className="mx-auto w-full max-w-5xl">
                <PageHeader
                    title="Tambah tracking penyerahan"
                    description={
                        <>
                            {sale.invoice_number} · {carName} ·{' '}
                            {sale.car?.license_plate ?? 'Tanpa plat'}
                        </>
                    }
                />

                <HandoverForm sale={sale} />
            </PageContainer>
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

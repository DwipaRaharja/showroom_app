import { Head, Link } from '@inertiajs/react';
import { ArrowLeftIcon } from '@phosphor-icons/react';
import VehicleHandoverController from '@/actions/App/Http/Controllers/VehicleHandoverController';
import { Button } from '@/components/ui/button';
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

            <div className="flex h-full min-w-0 flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex items-start gap-3">
                    <Button
                        variant="outline"
                        size="icon"
                        className="mt-0.5 shrink-0"
                        asChild
                    >
                        <Link
                            href={VehicleHandoverController.show.url(sale.id)}
                            aria-label="Kembali ke riwayat tracking"
                        >
                            <ArrowLeftIcon />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Tambah Tracking Penyerahan
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {sale.invoice_number} · {carName} ·{' '}
                            {sale.car?.license_plate ?? 'Tanpa plat'}
                        </p>
                    </div>
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

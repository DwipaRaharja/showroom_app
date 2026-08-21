import { Head } from '@inertiajs/react';
import { BrandDataTable } from '@/pages/brands/data-table';
import type { Brand } from '@/pages/brands/types';
import { index as brandsIndex } from '@/routes/brands';

type Props = {
    brands: Brand[];
};

export default function BrandsIndex({ brands }: Props) {
    return (
        <>
            <Head title="Merek" />

            <div className="flex h-full min-w-0 flex-1 flex-col gap-6 p-4 md:p-6">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Merek
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Kelola dan pantau seluruh merek kendaraan showroom.
                    </p>
                </div>

                <BrandDataTable data={brands} />
            </div>
        </>
    );
}

BrandsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Merek',
            href: brandsIndex.url(),
        },
    ],
};

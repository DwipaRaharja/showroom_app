import { Head } from '@inertiajs/react';
import { PageContainer } from '@/components/page-container';
import { PageHeader } from '@/components/page-header';
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

            <PageContainer>
                <PageHeader
                    title="Merek"
                    description="Kelola dan pantau seluruh merek kendaraan showroom."
                />

                <BrandDataTable data={brands} />
            </PageContainer>
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

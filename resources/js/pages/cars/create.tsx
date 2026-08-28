import { Head } from '@inertiajs/react';
import { PageContainer } from '@/components/page-container';
import { PageHeader } from '@/components/page-header';
import type { Brand } from '@/pages/brands/types';
import { CarForm } from '@/pages/cars/car-form';
import { create as carsCreate, index as carsIndex } from '@/routes/cars';

type Props = {
    brands: Pick<Brand, 'id' | 'name'>[];
};

export default function CarsCreate({ brands }: Props) {
    return (
        <>
            <Head title="Tambah Mobil" />

            <PageContainer className="mx-auto w-full max-w-5xl">
                <PageHeader
                    title="Tambah unit mobil"
                    description="Lengkapi informasi unit baru yang akan masuk ke inventaris showroom."
                />

                <CarForm car={null} brands={brands} />
            </PageContainer>
        </>
    );
}

CarsCreate.layout = {
    breadcrumbs: [
        {
            title: 'Mobil',
            href: carsIndex.url(),
        },
        {
            title: 'Tambah Mobil',
            href: carsCreate.url(),
        },
    ],
};

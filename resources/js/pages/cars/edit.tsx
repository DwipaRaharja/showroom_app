import { Head } from '@inertiajs/react';
import { PageContainer } from '@/components/page-container';
import { PageHeader } from '@/components/page-header';
import type { Brand } from '@/pages/brands/types';
import { CarForm } from '@/pages/cars/car-form';
import type { Car } from '@/pages/cars/types';
import { index as carsIndex } from '@/routes/cars';

type Props = {
    car: Car;
    brands: Pick<Brand, 'id' | 'name'>[];
};

export default function CarsEdit({ car, brands }: Props) {
    return (
        <>
            <Head title={`Edit ${car.name}`} />

            <PageContainer className="mx-auto w-full max-w-5xl">
                <PageHeader
                    title="Edit unit mobil"
                    description={`Perbarui informasi ${car.name} tanpa meninggalkan alur pengelolaan inventaris.`}
                />

                <CarForm car={car} brands={brands} />
            </PageContainer>
        </>
    );
}

CarsEdit.layout = {
    breadcrumbs: [
        {
            title: 'Mobil',
            href: carsIndex.url(),
        },
        {
            title: 'Edit Mobil',
            href: carsIndex.url(),
        },
    ],
};

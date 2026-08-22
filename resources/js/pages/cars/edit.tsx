import { Head } from '@inertiajs/react';
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

            <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 md:p-6">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Edit unit mobil
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Perbarui informasi {car.name} tanpa meninggalkan alur
                        pengelolaan inventaris.
                    </p>
                </div>

                <CarForm car={car} brands={brands} />
            </div>
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

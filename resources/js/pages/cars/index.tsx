import { Head } from '@inertiajs/react';
import { CarDataTable } from '@/pages/cars/data-table';
import type { Car } from '@/pages/cars/types';
import { index as carsIndex } from '@/routes/cars';

type Props = {
    cars: Car[];
};

export default function CarsIndex({ cars }: Props) {
    return (
        <>
            <Head title="Mobil" />

            <div className="flex h-full min-w-0 flex-1 flex-col gap-6 p-4 md:p-6">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Mobil
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Kelola dan pantau seluruh unit mobil showroom.
                    </p>
                </div>

                <CarDataTable data={cars} />
            </div>
        </>
    );
}

CarsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Mobil',
            href: carsIndex.url(),
        },
    ],
};

import { Head } from '@inertiajs/react';
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

            <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 md:p-6">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Tambah unit mobil
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Lengkapi informasi unit baru yang akan masuk ke
                        inventaris showroom.
                    </p>
                </div>

                <CarForm car={null} brands={brands} />
            </div>
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

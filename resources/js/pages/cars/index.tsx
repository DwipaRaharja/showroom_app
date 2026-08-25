import { Head } from '@inertiajs/react';
import {
    CheckCircleIcon,
    CoinsIcon,
    TagIcon,
    WrenchIcon,
} from '@phosphor-icons/react';
import { StatCard } from '@/components/stat-card';
import { CarDataTable } from '@/pages/cars/data-table';
import type { Car, CarSummary } from '@/pages/cars/types';
import { index as carsIndex } from '@/routes/cars';

type Props = {
    cars: Car[];
    summary: CarSummary;
};

const currencyFormatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
});

export default function CarsIndex({ cars, summary }: Props) {
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

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        title="Unit Tersedia (Ready)"
                        value={`${summary.available} Unit`}
                        description="Siap ditawarkan & dipajang"
                        icon={CheckCircleIcon}
                        variant="success"
                    />
                    <StatCard
                        title="Total Modal Stok Aktif"
                        value={currencyFormatter.format(
                            summary.total_active_capital,
                        )}
                        description="Modal tertahan di unit belum terjual"
                        icon={CoinsIcon}
                        variant="warning"
                        valueClassName="text-base"
                    />
                    <StatCard
                        title="Potensi Nilai Jual Stok"
                        value={currencyFormatter.format(
                            summary.potential_selling_turnover,
                        )}
                        description="Estimasi omzet unit ready"
                        icon={TagIcon}
                        variant="info"
                        valueClassName="text-base"
                    />
                    <StatCard
                        title="Unit Dalam Perbaikan / Salon"
                        value={`${summary.maintenance} Unit`}
                        description="Tahap servis / salon fisik"
                        icon={WrenchIcon}
                        variant="danger"
                    />
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

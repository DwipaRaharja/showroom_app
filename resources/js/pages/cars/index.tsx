import { Head } from '@inertiajs/react';
import {
    CheckCircleIcon,
    CoinsIcon,
    TagIcon,
    WrenchIcon,
} from '@phosphor-icons/react';
import { PageContainer } from '@/components/page-container';
import { PageHeader } from '@/components/page-header';
import { StatCard } from '@/components/stat-card';
import { StatCardGrid } from '@/components/stat-card-grid';
import { formatCurrency } from '@/lib/formatters';
import { CarDataTable } from '@/pages/cars/data-table';
import type { Car, CarSummary } from '@/pages/cars/types';
import { index as carsIndex } from '@/routes/cars';

type Props = {
    cars: Car[];
    summary: CarSummary;
};

export default function CarsIndex({ cars, summary }: Props) {
    return (
        <>
            <Head title="Mobil" />

            <PageContainer>
                <PageHeader
                    title="Mobil"
                    description="Kelola dan pantau seluruh unit mobil showroom."
                />

                <StatCardGrid>
                    <StatCard
                        title="Unit Tersedia (Ready)"
                        value={`${summary.available} Unit`}
                        icon={CheckCircleIcon}
                        variant="success"
                    />
                    <StatCard
                        title="Total Modal Stok Aktif"
                        value={formatCurrency(summary.total_active_capital)}
                        icon={CoinsIcon}
                        variant="warning"
                        valueClassName="text-base"
                    />
                    <StatCard
                        title="Potensi Nilai Jual Stok"
                        value={formatCurrency(
                            summary.potential_selling_turnover,
                        )}
                        icon={TagIcon}
                        variant="info"
                        valueClassName="text-base"
                    />
                    <StatCard
                        title="Unit Dalam Perbaikan / Salon"
                        value={`${summary.maintenance} Unit`}
                        icon={WrenchIcon}
                        variant="danger"
                    />
                </StatCardGrid>

                <CarDataTable data={cars} />
            </PageContainer>
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

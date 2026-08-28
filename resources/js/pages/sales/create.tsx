import { Head } from '@inertiajs/react';
import { PageContainer } from '@/components/page-container';
import { PageHeader } from '@/components/page-header';
import type { Brand } from '@/pages/brands/types';
import type { Car } from '@/pages/cars/types';
import type { Customer } from '@/pages/customers/types';
import { SaleForm } from '@/pages/sales/sale-form';
import type { FinanceCompany } from '@/pages/sales/types';
import { create as salesCreate, index as salesIndex } from '@/routes/sales';

type Props = {
    available_cars: Car[];
    customers: Pick<Customer, 'id' | 'name' | 'phone' | 'ktp_number'>[];
    finance_companies: FinanceCompany[];
    brands?: Pick<Brand, 'id' | 'name'>[];
};

export default function SalesCreate({
    available_cars,
    customers,
    finance_companies,
    brands = [],
}: Props) {
    return (
        <>
            <Head title="Buat Penjualan Baru" />

            <PageContainer>
                <PageHeader
                    title="Buat Penjualan Baru (SPK)"
                    description="Pilih unit mobil, customer, dan skema pembayaran (Tunai Lunas, Tunai Tempo, Kredit Leasing, atau Tukar Tambah)."
                />

                <SaleForm
                    availableCars={available_cars}
                    customers={customers}
                    financeCompanies={finance_companies}
                    brands={brands}
                />
            </PageContainer>
        </>
    );
}

SalesCreate.layout = {
    breadcrumbs: [
        {
            title: 'Penjualan',
            href: salesIndex.url(),
        },
        {
            title: 'Buat Penjualan Baru',
            href: salesCreate.url(),
        },
    ],
};

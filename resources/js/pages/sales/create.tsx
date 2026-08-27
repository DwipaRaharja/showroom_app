import { Head } from '@inertiajs/react';
import type { Car } from '@/pages/cars/types';
import type { Customer } from '@/pages/customers/types';
import { SaleForm } from '@/pages/sales/sale-form';
import type { FinanceCompany } from '@/pages/sales/types';
import { create as salesCreate, index as salesIndex } from '@/routes/sales';

type Props = {
    available_cars: Car[];
    customers: Pick<Customer, 'id' | 'name' | 'phone' | 'ktp_number'>[];
    finance_companies: FinanceCompany[];
};

export default function SalesCreate({
    available_cars,
    customers,
    finance_companies,
}: Props) {
    return (
        <>
            <Head title="Buat Penjualan Baru" />

            <div className="flex h-full min-w-0 flex-1 flex-col gap-6 p-4 md:p-6">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Buat Penjualan Baru (SPK)
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Pilih unit mobil, customer, dan skema pembayaran (Tunai
                        Lunas, Tunai Tempo, atau Kredit Leasing).
                    </p>
                </div>

                <SaleForm
                    availableCars={available_cars}
                    customers={customers}
                    financeCompanies={finance_companies}
                />
            </div>
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

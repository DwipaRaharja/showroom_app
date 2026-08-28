import { Head } from '@inertiajs/react';
import { PageContainer } from '@/components/page-container';
import { PageHeader } from '@/components/page-header';
import { CustomerDataTable } from '@/pages/customers/data-table';
import type { Customer } from '@/pages/customers/types';
import { index as customersIndex } from '@/routes/customers';

type Props = {
    customers: Customer[];
};

export default function CustomersIndex({ customers }: Props) {
    return (
        <>
            <Head title="Customer" />

            <PageContainer>
                <PageHeader
                    title="Customer"
                    description="Kelola dan pantau seluruh data customer showroom."
                />

                <CustomerDataTable data={customers} />
            </PageContainer>
        </>
    );
}

CustomersIndex.layout = {
    breadcrumbs: [
        {
            title: 'Customer',
            href: customersIndex.url(),
        },
    ],
};

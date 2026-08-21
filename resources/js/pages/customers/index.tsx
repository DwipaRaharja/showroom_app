import { Head } from '@inertiajs/react';
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

            <div className="flex h-full min-w-0 flex-1 flex-col gap-6 p-4 md:p-6">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Customer
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Kelola dan pantau seluruh data customer showroom.
                    </p>
                </div>

                <CustomerDataTable data={customers} />
            </div>
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

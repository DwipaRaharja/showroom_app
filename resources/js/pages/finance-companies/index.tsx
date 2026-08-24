import { Head } from '@inertiajs/react';
import {
    BankIcon,
    CheckCircleIcon,
    HandCoinsIcon,
    PowerIcon,
} from '@phosphor-icons/react';
import { StatCard } from '@/components/stat-card';
import { FinanceCompanyDataTable } from '@/pages/finance-companies/data-table';
import type {
    FinanceCompany,
    FinanceCompanySummary,
} from '@/pages/finance-companies/types';
import { index as financeCompaniesIndex } from '@/routes/finance-companies';

type Props = {
    finance_companies: FinanceCompany[];
    summary: FinanceCompanySummary;
};

export default function FinanceCompaniesIndex({
    finance_companies,
    summary,
}: Props) {
    return (
        <>
            <Head title="Perusahaan Leasing" />

            <div className="flex h-full min-w-0 flex-1 flex-col gap-6 p-4 md:p-6">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Perusahaan Leasing
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Kelola data rekanan perusahaan pembiayaan (leasing) dan kontak PIC untuk transaksi penjualan kredit.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        title="Total Rekanan Leasing"
                        value={summary.total}
                        icon={BankIcon}
                        variant="default"
                    />
                    <StatCard
                        title="Rekanan Aktif"
                        value={summary.active}
                        icon={CheckCircleIcon}
                        variant="success"
                    />
                    <StatCard
                        title="Rekanan Nonaktif"
                        value={summary.inactive}
                        icon={PowerIcon}
                        variant="warning"
                    />
                    <StatCard
                        title="Penjualan Didanai"
                        value={`${summary.total_sales_financed} Transaksi`}
                        icon={HandCoinsIcon}
                        variant="info"
                    />
                </div>

                <FinanceCompanyDataTable data={finance_companies} />
            </div>
        </>
    );
}

FinanceCompaniesIndex.layout = {
    breadcrumbs: [
        {
            title: 'Leasing',
            href: financeCompaniesIndex.url(),
        },
    ],
};

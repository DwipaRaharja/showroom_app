import { Head } from '@inertiajs/react';
import {
    BankIcon,
    CheckCircleIcon,
    HandCoinsIcon,
    PowerIcon,
} from '@phosphor-icons/react';
import { PageContainer } from '@/components/page-container';
import { PageHeader } from '@/components/page-header';
import { StatCard } from '@/components/stat-card';
import { StatCardGrid } from '@/components/stat-card-grid';
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

            <PageContainer>
                <PageHeader
                    title="Perusahaan Leasing"
                    description="Kelola data rekanan perusahaan pembiayaan (leasing) dan kontak PIC untuk transaksi penjualan kredit."
                />

                <StatCardGrid>
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
                </StatCardGrid>

                <FinanceCompanyDataTable data={finance_companies} />
            </PageContainer>
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

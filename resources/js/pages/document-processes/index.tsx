import { Head } from '@inertiajs/react';
import {
    CheckCircleIcon,
    ClockCountdownIcon,
    CurrencyCircleDollarIcon,
    WarningCircleIcon,
} from '@phosphor-icons/react';
import DocumentProcessController from '@/actions/App/Http/Controllers/DocumentProcessController';
import { PageContainer } from '@/components/page-container';
import { PageHeader } from '@/components/page-header';
import { StatCard } from '@/components/stat-card';
import { StatCardGrid } from '@/components/stat-card-grid';
import { formatCurrency } from '@/lib/formatters';
import { ProcessDataTable } from '@/pages/document-processes/data-table';
import type {
    DocumentProcess,
    LabelOptions,
    ProcessSummary,
} from '@/pages/document-processes/types';

type Props = {
    processes: DocumentProcess[];
    summary: ProcessSummary;
    type_options: LabelOptions;
    status_options: LabelOptions;
};

export default function DocumentProcessesIndex({
    processes,
    summary,
    type_options: typeOptions,
    status_options: statusOptions,
}: Props) {
    return (
        <>
            <Head title="Proses Berkas" />

            <PageContainer>
                <PageHeader
                    title="Proses Berkas"
                    description="Kelola pengurusan pajak, balik nama, mutasi, dokumen, biaya, dan riwayat progres setiap kendaraan."
                />

                <StatCardGrid className="lg:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        title="Proses Aktif"
                        value={summary.active}
                        icon={ClockCountdownIcon}
                        variant="info"
                    />
                    <StatCard
                        title="Melewati Target"
                        value={summary.overdue}
                        icon={WarningCircleIcon}
                        variant="danger"
                    />
                    <StatCard
                        title="Selesai / Dikembalikan"
                        value={summary.completed}
                        icon={CheckCircleIcon}
                        variant="success"
                    />
                    <StatCard
                        title="Biaya Masuk Modal"
                        value={formatCurrency(summary.capitalized_cost)}
                        icon={CurrencyCircleDollarIcon}
                        variant="warning"
                        valueClassName="text-base"
                    />
                </StatCardGrid>

                <ProcessDataTable
                    processes={processes}
                    typeOptions={typeOptions}
                    statusOptions={statusOptions}
                />
            </PageContainer>
        </>
    );
}

DocumentProcessesIndex.layout = {
    breadcrumbs: [
        {
            title: 'Proses Berkas',
            href: DocumentProcessController.index.url(),
        },
    ],
};

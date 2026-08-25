import { Head } from '@inertiajs/react';
import {
    CheckCircleIcon,
    ClockCountdownIcon,
    CurrencyCircleDollarIcon,
    WarningCircleIcon,
} from '@phosphor-icons/react';
import DocumentProcessController from '@/actions/App/Http/Controllers/DocumentProcessController';
import { StatCard } from '@/components/stat-card';
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

const currencyFormatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
});

export default function DocumentProcessesIndex({
    processes,
    summary,
    type_options: typeOptions,
    status_options: statusOptions,
}: Props) {
    return (
        <>
            <Head title="Proses Berkas" />

            <div className="flex h-full min-w-0 flex-1 flex-col gap-6 p-4 md:p-6">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Proses Berkas
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Kelola pengurusan pajak, balik nama, mutasi, dokumen,
                        biaya, dan riwayat progres setiap kendaraan.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
                        value={currencyFormatter.format(
                            summary.capitalized_cost,
                        )}
                        icon={CurrencyCircleDollarIcon}
                        variant="warning"
                        valueClassName="text-base"
                    />
                </div>

                <ProcessDataTable
                    processes={processes}
                    typeOptions={typeOptions}
                    statusOptions={statusOptions}
                />
            </div>
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

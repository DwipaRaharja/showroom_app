import { Head } from '@inertiajs/react';
import {
    CheckCircleIcon,
    ClockCountdownIcon,
    FilesIcon,
    WarningCircleIcon,
} from '@phosphor-icons/react';
import { StatCard } from '@/components/stat-card';
import { DocumentProcessDataTable } from '@/pages/document-processes/data-table';
import type {
    DocumentProcess,
    DocumentProcessSummary,
} from '@/pages/document-processes/types';
import { index as documentProcessesIndex } from '@/routes/document-processes';

type Props = {
    processes: DocumentProcess[];
    summary: DocumentProcessSummary;
};

export default function DocumentProcessesIndex({ processes, summary }: Props) {
    return (
        <>
            <Head title="Proses Berkas" />
            <div className="flex h-full min-w-0 flex-1 flex-col gap-6 p-4 md:p-6">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Proses Berkas
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Pantau kelengkapan, pemrosesan, dan penyerahan dokumen
                        untuk setiap transaksi penjualan.
                    </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                    <StatCard
                        title="Total Proses"
                        value={summary.total}
                        icon={FilesIcon}
                        variant="default"
                    />
                    <StatCard
                        title="Menunggu Dokumen"
                        value={summary.waiting}
                        icon={ClockCountdownIcon}
                        variant="warning"
                    />
                    <StatCard
                        title="Sedang Berjalan"
                        value={summary.in_progress}
                        icon={FilesIcon}
                        variant="info"
                    />
                    <StatCard
                        title="Selesai / Diserahkan"
                        value={summary.completed}
                        icon={CheckCircleIcon}
                        variant="success"
                    />
                    <StatCard
                        title="Terlambat"
                        value={summary.overdue}
                        icon={WarningCircleIcon}
                        variant="danger"
                    />
                </div>

                <DocumentProcessDataTable data={processes} />
            </div>
        </>
    );
}

DocumentProcessesIndex.layout = {
    breadcrumbs: [
        { title: 'Proses Berkas', href: documentProcessesIndex.url() },
    ],
};

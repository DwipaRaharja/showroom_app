import { Head } from '@inertiajs/react';
import {
    CheckCircleIcon,
    ClockCountdownIcon,
    FilesIcon,
    WarningCircleIcon,
} from '@phosphor-icons/react';
import { Card } from '@/components/ui/card';
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
    const cards = [
        { label: 'Total Proses', value: summary.total, icon: FilesIcon },
        {
            label: 'Menunggu Dokumen',
            value: summary.waiting,
            icon: ClockCountdownIcon,
        },
        {
            label: 'Sedang Berjalan',
            value: summary.in_progress,
            icon: FilesIcon,
        },
        {
            label: 'Selesai / Diserahkan',
            value: summary.completed,
            icon: CheckCircleIcon,
        },
        {
            label: 'Terlambat',
            value: summary.overdue,
            icon: WarningCircleIcon,
            danger: true,
        },
    ];

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
                    {cards.map((card) => (
                        <Card key={card.label} className="gap-2 p-4">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-muted-foreground">
                                    {card.label}
                                </span>
                                <card.icon
                                    className={
                                        card.danger ? 'text-red-500' : 'text-primary'
                                    }
                                />
                            </div>
                            <div
                                className={`text-2xl font-bold ${card.danger ? 'text-red-500' : ''}`}
                            >
                                {card.value}
                            </div>
                        </Card>
                    ))}
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

import type { ComponentProps } from 'react';
import { StatusBadge } from '@/components/status-badge';
import { cn } from '@/lib/utils';
import type {
    DocumentProcessStatus,
    LabelOptions,
} from '@/pages/document-processes/types';

type StatusMetadata = {
    className: string;
};

export const documentProcessStatusMetadata: Record<
    DocumentProcessStatus,
    StatusMetadata
> = {
    waiting_documents: {
        className:
            'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
    },
    documents_ready: {
        className:
            'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300',
    },
    submitted: {
        className:
            'border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300',
    },
    processing: {
        className:
            'border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300',
    },
    ready_for_pickup: {
        className:
            'border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300',
    },
    completed: {
        className:
            'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    },
    returned: {
        className:
            'border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-300',
    },
    issue: {
        className: 'border-red-500/30 bg-red-500/10 text-red-500',
    },
    cancelled: {
        className: 'border-muted bg-muted text-muted-foreground',
    },
};

type Props = Omit<ComponentProps<typeof StatusBadge>, 'status' | 'label'> & {
    status: DocumentProcessStatus;
    labels: LabelOptions;
};

export function ProcessStatusBadge({
    status,
    labels,
    className,
    ...props
}: Props) {
    const metadata = documentProcessStatusMetadata[status];

    return (
        <StatusBadge
            status={status}
            label={labels[status] ?? status}
            className={cn(metadata.className, className)}
            {...props}
        />
    );
}

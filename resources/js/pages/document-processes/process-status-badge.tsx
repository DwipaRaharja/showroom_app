import type { ComponentProps } from 'react';
import { StatusBadge } from '@/components/status-badge';
import type {
    DocumentProcessStatus,
    LabelOptions,
} from '@/pages/document-processes/types';

type Props = Omit<ComponentProps<typeof StatusBadge>, 'status' | 'label'> & {
    status: DocumentProcessStatus;
    labels?: LabelOptions;
};

export function ProcessStatusBadge({
    status,
    labels,
    className,
    ...props
}: Props) {
    return (
        <StatusBadge
            status={status}
            label={labels ? (labels[status] ?? status) : undefined}
            className={className}
            {...props}
        />
    );
}


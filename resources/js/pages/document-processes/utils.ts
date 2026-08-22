import type {
    DocumentProcessItemStatus,
    DocumentProcessStatus,
    DocumentProcessType,
    RecipientType,
} from '@/pages/document-processes/types';

export const processTypeOptions: {
    value: DocumentProcessType;
    label: string;
}[] = [
    { value: 'handover', label: 'Penyerahan dokumen' },
    { value: 'name_transfer', label: 'Balik nama' },
    { value: 'mutation', label: 'Mutasi kendaraan' },
    { value: 'renewal', label: 'Perpanjangan dokumen' },
    { value: 'other', label: 'Proses lainnya' },
];

export const processStatusOptions: {
    value: DocumentProcessStatus;
    label: string;
}[] = [
    { value: 'waiting_documents', label: 'Menunggu kelengkapan' },
    { value: 'ready', label: 'Siap diproses' },
    { value: 'processing', label: 'Sedang diproses' },
    { value: 'completed', label: 'Proses selesai' },
    { value: 'handed_over', label: 'Sudah diserahkan' },
    { value: 'issue', label: 'Bermasalah' },
    { value: 'cancelled', label: 'Dibatalkan' },
];

export const itemStatusOptions: {
    value: DocumentProcessItemStatus;
    label: string;
}[] = [
    { value: 'waiting', label: 'Menunggu dokumen' },
    { value: 'ready', label: 'Siap diproses' },
    { value: 'processing', label: 'Sedang diproses' },
    { value: 'completed', label: 'Proses selesai' },
    { value: 'handed_over', label: 'Sudah diserahkan' },
    { value: 'issue', label: 'Bermasalah' },
];

export const recipientTypeOptions: {
    value: RecipientType;
    label: string;
}[] = [
    { value: 'customer', label: 'Customer' },
    { value: 'finance_company', label: 'Leasing / finance' },
    { value: 'other', label: 'Pihak lainnya' },
];

export function getProcessTypeLabel(type: DocumentProcessType): string {
    return (
        processTypeOptions.find((option) => option.value === type)?.label ??
        type
    );
}

export function getProcessStatusLabel(status: DocumentProcessStatus): string {
    return (
        processStatusOptions.find((option) => option.value === status)?.label ??
        status
    );
}

export function getItemStatusLabel(status: DocumentProcessItemStatus): string {
    return (
        itemStatusOptions.find((option) => option.value === status)?.label ??
        status
    );
}

export function getRecipientTypeLabel(type: RecipientType | null): string {
    if (!type) {
return '—';
}

    return (
        recipientTypeOptions.find((option) => option.value === type)?.label ??
        type
    );
}

export function isProcessOverdue(
    estimatedDate: string | null,
    status: DocumentProcessStatus,
): boolean {
    if (
        !estimatedDate ||
        ['completed', 'handed_over', 'cancelled'].includes(status)
    ) {
        return false;
    }

    return estimatedDate.slice(0, 10) < new Date().toISOString().slice(0, 10);
}

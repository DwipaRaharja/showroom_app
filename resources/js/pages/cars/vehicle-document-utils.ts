import type {
    VehicleDocument,
    VehicleDocumentState,
    VehicleDocumentStatus,
    VehicleDocumentType,
} from '@/pages/cars/types';

export const documentTypeOptions: {
    value: VehicleDocumentType;
    label: string;
    required: boolean;
}[] = [
    { value: 'stnk', label: 'STNK', required: true },
    { value: 'bpkb', label: 'BPKB', required: true },
    { value: 'invoice', label: 'Faktur kendaraan', required: true },
    { value: 'receipt', label: 'Kuitansi pembelian', required: true },
    { value: 'form_a', label: 'Form A', required: false },
    { value: 'kir', label: 'Buku KIR', required: false },
    { value: 'other', label: 'Dokumen lainnya', required: false },
];

export const documentStatusOptions: {
    value: VehicleDocumentStatus;
    label: string;
}[] = [
    { value: 'complete', label: 'Lengkap' },
    { value: 'pending', label: 'Belum diterima' },
    { value: 'processing', label: 'Sedang diproses' },
    { value: 'missing', label: 'Tidak tersedia' },
];

export const requiredDocumentTypes = documentTypeOptions
    .filter((option) => option.required)
    .map((option) => option.value);

export function getDocumentTypeLabel(type: VehicleDocumentType): string {
    return (
        documentTypeOptions.find((option) => option.value === type)?.label ??
        type
    );
}

function localDateString(): string {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60_000;

    return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

export function isDocumentExpired(document: VehicleDocument): boolean {
    return Boolean(
        document.expires_at &&
        document.expires_at.slice(0, 10) < localDateString(),
    );
}

export function getEffectiveDocumentStatus(
    document: VehicleDocument,
): VehicleDocumentStatus | 'expired' {
    return isDocumentExpired(document) ? 'expired' : document.status;
}

export function getCarDocumentState(
    documents: VehicleDocument[] = [],
): VehicleDocumentState {
    if (documents.some(isDocumentExpired)) {
        return 'expired';
    }

    const requiredDocumentsAreComplete = requiredDocumentTypes.every((type) => {
        const document = documents.find(
            (candidate) => candidate.document_type === type,
        );

        return document?.status === 'complete' && document.original_received;
    });

    return requiredDocumentsAreComplete ? 'complete' : 'incomplete';
}

export function countCompleteRequiredDocuments(
    documents: VehicleDocument[] = [],
): number {
    return requiredDocumentTypes.filter((type) => {
        const document = documents.find(
            (candidate) => candidate.document_type === type,
        );

        return document?.status === 'complete' && document.original_received;
    }).length;
}

export function formatFileSize(size: number | null): string | null {
    if (size === null) {
        return null;
    }

    if (size < 1024) {
        return `${size} B`;
    }

    if (size < 1024 * 1024) {
        return `${(size / 1024).toFixed(1)} KB`;
    }

    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

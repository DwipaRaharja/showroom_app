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
];

export const stnkStatusOptions = [
    { value: 'printing', label: 'Sedang dicetak' },
    { value: 'complete', label: 'Lengkap' },
    { value: 'incomplete', label: 'Tidak lengkap' },
] as const;

export const bpkbStatusOptions = [
    { value: 'printing', label: 'Sedang dicetak' },
    { value: 'ready', label: 'Ready' },
    { value: 'uncollected', label: 'Belum diambil' },
] as const;

export const invoiceStatusOptions = [
    { value: 'ready', label: 'Ready' },
    { value: 'not_ready', label: 'Belum ready' },
] as const;

export const requiredDocumentTypes = documentTypeOptions.map(
    (option) => option.value,
);

export function getDocumentTypeLabel(type: VehicleDocumentType): string {
    const knownLabels: Partial<Record<VehicleDocumentType, string>> = {
        stnk: 'STNK',
        bpkb: 'BPKB',
        invoice: 'Faktur kendaraan',
        receipt: 'Kuitansi pembelian',
        form_a: 'Form A',
        kir: 'Buku KIR',
        other: 'Dokumen lainnya',
    };

    return knownLabels[type] ?? type;
}

export function getDocumentStatusLabel(
    type: VehicleDocumentType,
    status: VehicleDocumentStatus,
): string {
    const options =
        type === 'stnk'
            ? stnkStatusOptions
            : type === 'bpkb'
              ? bpkbStatusOptions
              : invoiceStatusOptions;

    return options.find((option) => option.value === status)?.label ?? status;
}

function localDateString(): string {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60_000;

    return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

export function isDocumentExpired(document: VehicleDocument): boolean {
    return Boolean(
        document.document_type === 'stnk' &&
        document.expires_at &&
        document.expires_at.slice(0, 10) < localDateString(),
    );
}

export function isDocumentReady(document: VehicleDocument): boolean {
    if (isDocumentExpired(document)) {
        return false;
    }

    switch (document.document_type) {
        case 'stnk':
            return document.status === 'complete';
        case 'bpkb':
            return ['ready', 'uncollected'].includes(document.status);
        case 'invoice':
            return document.status === 'ready';
        default:
            return false;
    }
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

        return document ? isDocumentReady(document) : false;
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

        return document ? isDocumentReady(document) : false;
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

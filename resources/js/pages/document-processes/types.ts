import type { VehicleDocument } from '@/pages/cars/types';

export type DocumentProcessType =
    'handover' | 'name_transfer' | 'mutation' | 'renewal' | 'other';

export type DocumentProcessStatus =
    | 'waiting_documents'
    | 'ready'
    | 'processing'
    | 'completed'
    | 'handed_over'
    | 'issue'
    | 'cancelled';

export type DocumentProcessItemStatus =
    'waiting' | 'ready' | 'processing' | 'completed' | 'handed_over' | 'issue';

export type RecipientType = 'customer' | 'finance_company' | 'other';

export type UserOption = {
    id: number;
    name: string;
};

export type DocumentProcessSale = {
    id: number;
    invoice_number: string;
    payment_type: 'cash_full' | 'cash_tempo' | 'credit';
    status: 'pending' | 'partial' | 'completed' | 'cancelled';
    is_settled?: boolean;
    car?: {
        id: number;
        name: string;
        license_plate: string | null;
        year: number;
        color?: string | null;
        transmission?: string;
        fuel_type?: string;
        brand?: { id: number; name: string } | null;
        documents?: VehicleDocument[];
    } | null;
    customer?: {
        id: number;
        name: string;
        phone: string | null;
        ktp_number?: string | null;
        address?: string | null;
    } | null;
    finance_company?: {
        id: number;
        name: string;
    } | null;
};

export type DocumentProcessItem = {
    id: number;
    document_process_id: number;
    vehicle_document_id: number | null;
    document_type: VehicleDocument['document_type'];
    document_number_snapshot: string | null;
    required: boolean;
    status: DocumentProcessItemStatus;
    recipient_type: RecipientType | null;
    recipient_name: string | null;
    handed_over_at: string | null;
    notes: string | null;
    vehicle_document?: VehicleDocument | null;
    created_at: string;
    updated_at: string;
};

export type DocumentProcessActivity = {
    id: number;
    type: string;
    description: string;
    metadata: Record<string, unknown> | null;
    user?: UserOption | null;
    created_at: string;
};

export type DocumentProcess = {
    id: number;
    process_number: string;
    sale_id: number;
    sale: DocumentProcessSale;
    assigned_to: number | null;
    assignee?: UserOption | null;
    process_type: DocumentProcessType;
    status: DocumentProcessStatus;
    started_at: string;
    estimated_completion_date: string | null;
    completed_at: string | null;
    handed_over_at: string | null;
    notes: string | null;
    completed_items_count: number;
    total_items_count: number;
    progress_percentage: number;
    items?: DocumentProcessItem[];
    activities?: DocumentProcessActivity[];
    created_at: string;
    updated_at: string;
};

export type DocumentProcessSummary = {
    total: number;
    waiting: number;
    in_progress: number;
    completed: number;
    overdue: number;
};

import type { Car, VehicleDocument } from '@/pages/cars/types';
import type { Customer } from '@/pages/customers/types';

export type DocumentProcessType =
    | 'annual_tax'
    | 'five_year_tax'
    | 'name_transfer'
    | 'mutation'
    | 'document_reissue'
    | 'other';

export type DocumentProcessStatus =
    'waiting_documents' | 'processing' | 'completed' | 'issue' | 'cancelled';

export type DocumentProcessItem = {
    id: number;
    document_process_id: number;
    vehicle_document_id: number | null;
    item_key: string;
    item_name: string;
    required: boolean;
    custody_status:
        'waiting' | 'received' | 'submitted' | 'returned' | 'missing';
    received_at: string | null;
    returned_at: string | null;
    notes: string | null;
    vehicle_document?: VehicleDocument | null;
};

export type DocumentProcessFile = {
    id: number;
    document_process_id: number;
    document_process_event_id: number | null;
    document_process_cost_id: number | null;
    file_category: string;
    file_name: string;
    file_mime: string | null;
    file_size: number | null;
    caption: string | null;
};

export type DocumentProcessEvent = {
    id: number;
    document_process_id: number;
    status: DocumentProcessStatus;
    occurred_at: string;
    description: string;
    location: string | null;
    recipient_name: string | null;
    recipient_phone: string | null;
    recipient_relation: string | null;
    notes: string | null;
    result_data: Record<string, string> | null;
    creator?: Pick<UserOption, 'id' | 'name'> | null;
    files: DocumentProcessFile[];
};

export type DocumentProcessCost = {
    id: number;
    document_process_id: number;
    cost_type: string;
    description: string;
    amount: number;
    paid_by: 'showroom' | 'customer';
    paid_at: string | null;
    creator?: Pick<UserOption, 'id' | 'name'> | null;
    receipt?: DocumentProcessFile | null;
};

export type ProcessCar = Pick<
    Car,
    'id' | 'name' | 'license_plate' | 'status' | 'brand' | 'capital'
> & {
    sale?: {
        id: number;
        customer_id: number;
        customer?: Pick<Customer, 'id' | 'name' | 'phone'>;
    } | null;
};

export type UserOption = {
    id: number;
    name: string;
};

export type DocumentProcess = {
    id: number;
    process_number: string;
    car_id: number;
    sale_id: number | null;
    customer_id: number | null;
    assigned_to: number | null;
    process_type: DocumentProcessType;
    status: DocumentProcessStatus;
    started_at: string;
    estimated_completion_date: string | null;
    completed_at: string | null;
    returned_at: string | null;
    cancelled_at: string | null;
    processor_name: string | null;
    processor_phone: string | null;
    origin_region: string | null;
    destination_region: string | null;
    target_owner_name: string | null;
    notes: string | null;
    total_cost: number;
    capitalized_cost: number;
    can_cancel: boolean;
    can_delete_permanently: boolean;
    car: ProcessCar;
    customer?: Pick<Customer, 'id' | 'name' | 'phone'> | null;
    assignee?: UserOption | null;
    items: DocumentProcessItem[];
    events: DocumentProcessEvent[];
    costs: DocumentProcessCost[];
    files: DocumentProcessFile[];
    created_at: string;
};

export type ProcessSummary = {
    active: number;
    overdue: number;
    completed: number;
    capitalized_cost: number;
};

export type LabelOptions = Record<string, string>;

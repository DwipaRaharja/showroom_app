import type { Brand } from '@/pages/brands/types';

export type CarStatus = 'available' | 'booked' | 'sold' | 'maintenance';
export type CarCapitalStatus = 'draft' | 'completed' | 'cancelled';
export type Transmission = 'manual' | 'automatic' | 'cvt';
export type FuelType = 'bensin' | 'diesel' | 'hybrid' | 'electric';
export type VehicleDocumentType =
    'stnk' | 'bpkb' | 'invoice' | 'receipt' | 'form_a' | 'kir' | 'other';
export type VehicleDocumentStatus =
    | 'printing'
    | 'complete'
    | 'incomplete'
    | 'ready'
    | 'uncollected'
    | 'not_ready';
export type VehicleDocumentState = 'complete' | 'incomplete' | 'expired';

export type VehicleDocument = {
    id: number;
    car_id: number;
    document_type: VehicleDocumentType;
    document_number: string | null;
    owner_name: string | null;
    issued_at: string | null;
    expires_at: string | null;
    annual_tax_due_at: string | null;
    status: VehicleDocumentStatus;
    original_received: boolean;
    notes: string | null;
    created_at: string;
};

export type VehicleDocumentAttachment = {
    id: number;
    car_id: number;
    file_name: string | null;
    file_mime: string | null;
    file_size: number | null;
    created_at: string;
    updated_at: string;
};

export type CarCapital = {
    id: number;
    purchase_number: string;
    car_id: number;
    purchase_date: string;
    price: number;
    repair_cost: number;
    transport_cost: number;
    other_cost: number;
    document_process_cost: number;
    total_capital: number;
    status: CarCapitalStatus;
    notes: string | null;
    created_at: string;
};

export type Car = {
    id: number;
    brand_id: number;
    brand?: Pick<Brand, 'id' | 'name'>;
    name: string;
    license_plate: string | null;
    chassis_number: string | null;
    engine_number: string | null;
    year: number;
    color: string | null;
    transmission: Transmission;
    fuel_type: FuelType;
    mileage: number;
    selling_price: number;
    status: CarStatus;
    description: string | null;
    image: string | null;
    deleted_at?: string | null;
    created_at: string;
    capital?: CarCapital | null;
    documents?: VehicleDocument[];
    document_attachment?: VehicleDocumentAttachment | null;
};

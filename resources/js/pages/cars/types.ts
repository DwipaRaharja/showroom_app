import type { Brand } from '@/pages/brands/types';

export type CarStatus = 'available' | 'booked' | 'sold' | 'maintenance';
export type Transmission = 'manual' | 'automatic' | 'cvt';
export type FuelType = 'bensin' | 'diesel' | 'hybrid' | 'electric';
export type VehicleDocumentType =
    'stnk' | 'bpkb' | 'invoice' | 'receipt' | 'form_a' | 'kir' | 'other';
export type VehicleDocumentStatus =
    'complete' | 'pending' | 'processing' | 'missing';
export type VehicleDocumentState = 'complete' | 'incomplete' | 'expired';

export type VehicleDocument = {
    id: number;
    car_id: number;
    document_type: VehicleDocumentType;
    document_number: string | null;
    owner_name: string | null;
    issued_at: string | null;
    expires_at: string | null;
    status: VehicleDocumentStatus;
    original_received: boolean;
    file_name: string | null;
    file_mime: string | null;
    file_size: number | null;
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
    purchase_price: number | null;
    selling_price: number;
    status: CarStatus;
    description: string | null;
    image: string | null;
    deleted_at?: string | null;
    created_at: string;
    documents?: VehicleDocument[];
};

import type { Car } from '@/pages/cars/types';
import type { Customer } from '@/pages/customers/types';

export type PaymentType = 'cash_full' | 'cash_tempo' | 'credit';
export type SaleStatus = 'pending' | 'partial' | 'completed' | 'cancelled';
export type PayerType = 'customer' | 'finance';
export type PaymentCategory =
    | 'down_payment'
    | 'settlement'
    | 'installment'
    | 'finance_disbursement'
    | 'leasing_bonus'
    | 'other';
export type PaymentMethod = 'transfer' | 'cash' | 'qris' | 'giro';
export type PaymentStatus = 'confirmed' | 'pending' | 'rejected';

export type FinanceCompany = {
    id: number;
    name: string;
    code: string | null;
    pic_name: string | null;
    pic_phone: string | null;
    is_active: boolean;
    notes: string | null;
    created_at?: string;
};

export type Payment = {
    id: number;
    payment_number: string;
    sale_id: number;
    payment_date: string;
    payer_type: PayerType;
    payment_category: PaymentCategory;
    amount: number;
    payment_method: PaymentMethod;
    destination_account: string;
    reference_number: string | null;
    proof_file: string | null;
    status: PaymentStatus;
    notes: string | null;
    created_at?: string;
};

export type HandoverStatus = 'pending' | 'vehicle_delivered' | 'completed';
export type RecipientRelation =
    'buyer_self' | 'family' | 'driver' | 'leasing_officer' | 'other';

export type HandoverItemCode =
    | 'vehicle'
    | 'stnk'
    | 'bpkb'
    | 'invoice'
    | 'keys'
    | 'manual_book'
    | 'service_book'
    | 'toolkit'
    | 'spare_tire'
    | 'blanko'
    | 'other';

export type HandoverChecklist = {
    key_count?: number;
    has_stnk?: boolean;
    has_bpkb?: boolean;
    has_faktur?: boolean;
    has_blanko?: boolean;
    has_manual_book?: boolean;
    has_service_book?: boolean;
    has_toolkit?: boolean;
    has_spare_tire?: boolean;
    has_jack?: boolean;
    fuel_level?: string;
    cleanliness?: string;
};

export type VehicleHandover = {
    id: number;
    handover_number: string;
    sale_id: number;
    car_id: number;
    recipient_name: string;
    recipient_phone: string | null;
    recipient_id_card: string | null;
    recipient_relation: RecipientRelation;
    officer_name: string;
    handover_location: string;
    handover_address: string | null;
    vehicle_delivered_at: string | null;
    bpkb_delivered_at: string | null;
    bpkb_recipient_type: 'customer' | 'finance_company' | null;
    status: HandoverStatus;
    checklist: HandoverChecklist | null;
    notes: string | null;
    proof_file: string | null;
    events: VehicleHandoverEvent[];
    created_at?: string;
    updated_at?: string;
};

export type VehicleHandoverItem = {
    id: number;
    vehicle_handover_event_id: number;
    item_code: HandoverItemCode;
    item_name: string;
    quantity: number;
    notes: string | null;
};

export type VehicleHandoverPhoto = {
    id: number;
    vehicle_handover_event_id: number;
    file_name: string;
    file_mime: string | null;
    file_size: number | null;
    caption: string | null;
};

export type VehicleHandoverEvent = {
    id: number;
    vehicle_handover_id: number;
    event_type: 'vehicle_delivery' | 'document_delivery' | 'item_delivery';
    occurred_at: string;
    recipient_name: string;
    recipient_phone: string | null;
    recipient_id_card: string | null;
    recipient_relation: RecipientRelation;
    officer_name: string;
    handover_location: string;
    handover_address: string | null;
    vehicle_condition: {
        fuel_level?: string | null;
        cleanliness?: string | null;
    } | null;
    notes: string | null;
    items: VehicleHandoverItem[];
    photos: VehicleHandoverPhoto[];
    created_at: string;
};

export type Sale = {
    id: number;
    invoice_number: string;
    car_id: number;
    car?: Car;
    customer_id: number;
    customer?: Customer;
    finance_company_id: number | null;
    finance_company?: FinanceCompany | null;
    payment_type: PaymentType;
    deal_price: number;
    down_payment: number;
    finance_amount: number;
    disbursement_estimated_date: string | null;
    disbursement_actual_date: string | null;
    leasing_bonus: number;
    due_date: string | null;
    status: SaleStatus;
    notes: string | null;
    created_at: string;
    updated_at: string;
    payments?: Payment[];
    handover?: VehicleHandover | null;
    total_paid?: number;
    remaining_bill?: number;
    total_finance_disbursed?: number;
    remaining_finance_disbursement?: number;
    customer_payment_shortfall?: number;
    total_bonus_paid?: number;
    is_settled?: boolean;
    has_down_payment?: boolean;
    can_accept_payment?: boolean;
    can_deliver_vehicle?: boolean;
    can_deliver_bpkb?: boolean;
};

export type SalesSummary = {
    total_turnover: number;
    total_collected: number;
    total_receivables: number;
    total_bonus_collected: number;
    pending_disbursements_count: number;
};

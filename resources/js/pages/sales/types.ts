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
    total_paid?: number;
    remaining_bill?: number;
    total_bonus_paid?: number;
    is_settled?: boolean;
    has_down_payment?: boolean;
    can_accept_payment?: boolean;
};

export type SalesSummary = {
    total_turnover: number;
    total_collected: number;
    total_receivables: number;
    total_bonus_collected: number;
    pending_disbursements_count: number;
};

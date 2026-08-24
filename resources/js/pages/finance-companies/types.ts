export type FinanceCompany = {
    id: number;
    name: string;
    code: string | null;
    pic_name: string | null;
    pic_phone: string | null;
    is_active: boolean;
    notes: string | null;
    sales_count?: number;
    created_at?: string;
    updated_at?: string;
};

export type FinanceCompanyFormData = {
    name: string;
    code: string;
    pic_name: string;
    pic_phone: string;
    is_active: boolean;
    notes: string;
};

export type FinanceCompanySummary = {
    total: number;
    active: number;
    inactive: number;
    total_sales_financed: number;
};

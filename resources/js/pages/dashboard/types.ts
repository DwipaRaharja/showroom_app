export type DashboardSeverity = 'danger' | 'warning' | 'info';

export type PaymentTypeBreakdown = {
    count: number;
    turnover: number;
    trade_in_value?: number;
};

export type DashboardSummary = {
    available: number;
    booked: number;
    maintenance: number;
    sales_this_month: number;
    turnover_this_month: number;
    payments_this_month: number;
    trade_in_this_month_count: number;
    trade_in_this_month_value: number;
    active_capital: number;
    incomplete_capital: number;
    customer_receivables: number;
    finance_receivables: number;
    payment_breakdown: Record<
        'cash_full' | 'cash_tempo' | 'credit' | 'trade_in',
        PaymentTypeBreakdown
    >;
};

export type AttentionItem = {
    id: string;
    kind: string;
    severity: DashboardSeverity;
    title: string;
    description: string;
    amount: number | null;
    date: string | null;
    href: string;
    action_label: string;
};

export type DocumentReminder = {
    id: string;
    kind: 'annual_tax' | 'five_year_tax' | 'documents_incomplete';
    severity: DashboardSeverity;
    title: string;
    car_name: string;
    license_plate: string | null;
    due_date: string | null;
    detail?: string;
    has_active_process: boolean;
    href: string;
    action_label: string;
};

export type PerformancePoint = {
    key: string;
    label: string;
    sales_count: number;
    turnover: number;
    payments: number;
    trade_in_count?: number;
    trade_in_value?: number;
};

export type StockAgingItem = {
    id: number;
    car_name: string;
    license_plate: string | null;
    stock_date: string | null;
    days_in_stock: number;
    capital: number | null;
    capital_status: 'draft' | 'completed' | 'cancelled' | 'missing';
    selling_price: number;
    href: string;
};

export type RecentSale = {
    id: number;
    invoice_number: string;
    car_name: string;
    customer_name: string;
    payment_type: 'cash_full' | 'cash_tempo' | 'credit' | 'trade_in';
    status: 'pending' | 'partial' | 'completed' | 'cancelled';
    deal_price: number;
    remaining_bill: number;
    created_at: string | null;
    href: string;
};

export type DashboardPeriod = 'this_month' | 'last_month' | 'this_year';

export type DashboardPeriodOption = {
    value: DashboardPeriod;
    label: string;
};

export type DashboardProps = {
    generated_at: string;
    period: DashboardPeriod;
    period_label: string;
    period_options: DashboardPeriodOption[];
    summary: DashboardSummary;
    attention: {
        total: number;
        financial: AttentionItem[];
        operational: AttentionItem[];
    };
    document_reminders: DocumentReminder[];
    performance: PerformancePoint[];
    stock_aging: StockAgingItem[];
    recent_sales: RecentSale[];
};

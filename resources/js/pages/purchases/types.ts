export type PurchaseStatus = 'draft' | 'completed' | 'cancelled';

export type PurchaseCar = {
    id: number;
    name: string;
    license_plate: string | null;
    year: number;
    brand?: {
        id: number;
        name: string;
    } | null;
};

export type Purchase = {
    id: number;
    purchase_number: string;
    car_id: number | null;
    car: PurchaseCar | null;
    purchase_date: string;
    price: number;
    repair_cost: number;
    transport_cost: number;
    other_cost: number;
    total_capital: number;
    status: PurchaseStatus;
    notes: string | null;
    created_at: string;
};

export type PurchaseFormValue = Omit<Purchase, 'car'>;

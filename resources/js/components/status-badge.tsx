import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type StatusType =
    | boolean
    | 'active'
    | 'inactive'
    | 'available'
    | 'booked'
    | 'sold'
    | 'maintenance'
    | 'draft'
    | 'completed'
    | 'cancelled'
    | 'partial'
    | 'confirmed'
    | 'rejected'
    | 'complete'
    | 'pending'
    | 'processing'
    | 'missing'
    | 'expired'
    | 'incomplete'
    | 'archived'
    | (string & {});

type StatusConfig = {
    label: string;
    className: string;
};

const statusMap: Record<string, StatusConfig> = {
    // Boolean / Active states
    true: {
        label: 'Aktif',
        className:
            'bg-emerald-600 text-white hover:bg-emerald-600 dark:bg-emerald-700',
    },
    false: {
        label: 'Tidak aktif',
        className:
            'bg-slate-500 text-white hover:bg-slate-500 dark:bg-slate-600',
    },
    active: {
        label: 'Aktif',
        className:
            'bg-emerald-600 text-white hover:bg-emerald-600 dark:bg-emerald-700',
    },
    inactive: {
        label: 'Tidak aktif',
        className:
            'bg-slate-500 text-white hover:bg-slate-500 dark:bg-slate-600',
    },
    archived: {
        label: 'Diarsipkan',
        className:
            'bg-slate-500 text-white hover:bg-slate-500 dark:bg-slate-600',
    },

    // Car statuses
    available: {
        label: 'Tersedia',
        className:
            'bg-emerald-600 text-white hover:bg-emerald-600 dark:bg-emerald-700',
    },
    booked: {
        label: 'Dibooking',
        className:
            'bg-amber-500 text-white hover:bg-amber-500 dark:bg-amber-600',
    },
    sold: {
        label: 'Terjual',
        className: 'bg-blue-600 text-white hover:bg-blue-600 dark:bg-blue-700',
    },
    maintenance: {
        label: 'Perbaikan',
        className: 'bg-rose-600 text-white hover:bg-rose-600 dark:bg-rose-700',
    },

    // Purchase & Sale statuses
    draft: {
        label: 'Draft',
        className:
            'bg-amber-500 text-white hover:bg-amber-500 dark:bg-amber-600',
    },
    partial: {
        label: 'Tempo / Piutang',
        className:
            'bg-amber-500 text-white hover:bg-amber-500 dark:bg-amber-600',
    },
    completed: {
        label: 'Lunas / Selesai',
        className:
            'bg-emerald-600 text-white hover:bg-emerald-600 dark:bg-emerald-700',
    },
    confirmed: {
        label: 'Terkonfirmasi',
        className:
            'bg-emerald-600 text-white hover:bg-emerald-600 dark:bg-emerald-700',
    },
    rejected: {
        label: 'Ditolak',
        className: 'bg-red-500 text-white hover:bg-red-500 dark:bg-red-500',
    },
    cancelled: {
        label: 'Dibatalkan',
        className: 'bg-red-500 text-white hover:bg-red-500 dark:bg-red-500',
    },

    // Vehicle document statuses
    complete: {
        label: 'Lengkap',
        className:
            'bg-emerald-600 text-white hover:bg-emerald-600 dark:bg-emerald-700',
    },
    pending: {
        label: 'Belum diterima',
        className:
            'bg-amber-500 text-white hover:bg-amber-500 dark:bg-amber-600',
    },
    processing: {
        label: 'Diproses',
        className: 'bg-blue-600 text-white hover:bg-blue-600 dark:bg-blue-700',
    },
    missing: {
        label: 'Tidak tersedia',
        className: 'bg-red-500 text-white hover:bg-red-500 dark:bg-red-500',
    },
    expired: {
        label: 'Kedaluwarsa',
        className: 'bg-red-500 text-white hover:bg-red-500 dark:bg-red-500',
    },
    incomplete: {
        label: 'Belum lengkap',
        className:
            'bg-amber-500 text-white hover:bg-amber-500 dark:bg-amber-600',
    },
};

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    status: StatusType;
    label?: string;
}

export function StatusBadge({
    status,
    label,
    className,
    ...props
}: StatusBadgeProps) {
    const key = String(status);
    const config = statusMap[key] ?? {
        label: key,
        className: 'bg-slate-500 text-white hover:bg-slate-500',
    };

    return (
        <Badge
            className={cn(
                'border-transparent font-medium shadow-none select-none',
                config.className,
                className,
            )}
            {...props}
        >
            {label ?? config.label}
        </Badge>
    );
}

import type { Icon } from '@phosphor-icons/react';
import type { ComponentType, ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export type StatCardVariant =
    | 'default'
    | 'success'
    | 'warning'
    | 'info'
    | 'danger'
    | 'purple';

export type StatCardProps = {
    title: string;
    value: string | number;
    icon?: Icon | ComponentType<{ className?: string; weight?: string }>;
    variant?: StatCardVariant;
    description?: ReactNode;
    className?: string;
    valueClassName?: string;
};

const variantStyles: Record<
    StatCardVariant,
    { iconBox: string; value: string }
> = {
    default: {
        iconBox: 'bg-primary/10 text-primary',
        value: 'text-foreground',
    },
    success: {
        iconBox: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
        value: 'text-emerald-600 dark:text-emerald-400',
    },
    warning: {
        iconBox: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
        value: 'text-amber-600 dark:text-amber-400',
    },
    info: {
        iconBox: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
        value: 'text-blue-600 dark:text-blue-400',
    },
    danger: {
        iconBox: 'bg-red-500/10 text-red-600 dark:text-red-400',
        value: 'text-red-600 dark:text-red-400',
    },
    purple: {
        iconBox: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
        value: 'text-purple-600 dark:text-purple-400',
    },
};

export function StatCard({
    title,
    value,
    icon: IconComponent,
    variant = 'default',
    description,
    className,
    valueClassName,
}: StatCardProps) {
    const styles = variantStyles[variant];

    return (
        <Card className={cn('p-4 shadow-xs', className)}>
            <div className="flex items-center gap-3">
                {IconComponent && (
                    <div
                        className={cn(
                            'flex size-10 shrink-0 items-center justify-center rounded-xl',
                            styles.iconBox,
                        )}
                    >
                        <IconComponent className="size-5" weight="bold" />
                    </div>
                )}
                <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-medium text-muted-foreground">
                        {title}
                    </div>
                    <div
                        className={cn(
                            'mt-0.5 text-lg font-bold tracking-tight',
                            styles.value,
                            valueClassName,
                        )}
                    >
                        {value}
                    </div>
                    {description && (
                        <div className="mt-0.5 text-xs text-muted-foreground">
                            {description}
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
}

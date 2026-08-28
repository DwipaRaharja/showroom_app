import type { ComponentProps, ReactNode } from 'react';
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface CardSectionHeaderProps
    extends Omit<ComponentProps<typeof CardHeader>, 'title'> {
    title: ReactNode;
    titleClassName?: string;
    description?: ReactNode;
    descriptionClassName?: string;
    icon?: ReactNode;
    iconClassName?: string;
    badge?: ReactNode;
    action?: ReactNode;
}

export function CardSectionHeader({
    title,
    titleClassName,
    description,
    descriptionClassName,
    icon,
    iconClassName,
    badge,
    action,
    className,
    children,
    ...props
}: CardSectionHeaderProps) {
    return (
        <CardHeader
            className={cn(
                'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
                className,
            )}
            {...props}
        >
            <div className="flex items-center gap-3">
                {icon && (
                    <div
                        className={cn(
                            'flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary',
                            iconClassName,
                        )}
                    >
                        {icon}
                    </div>
                )}
                <div className="space-y-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                        <CardTitle className={cn('text-base', titleClassName)}>
                            {title}
                        </CardTitle>
                        {badge}
                    </div>
                    {description && (
                        <CardDescription className={descriptionClassName}>
                            {description}
                        </CardDescription>
                    )}
                </div>
            </div>
            {action && (
                <div className="flex shrink-0 items-center gap-2">{action}</div>
            )}
            {children}
        </CardHeader>
    );
}

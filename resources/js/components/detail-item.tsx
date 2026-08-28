import { CopyIcon, type Icon } from '@phosphor-icons/react';
import type { ComponentType, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { copyToClipboard } from '@/lib/clipboard';
import { cn } from '@/lib/utils';

export type DetailItemProps = {
    label: ReactNode;
    value?: ReactNode;
    children?: ReactNode;
    icon?: Icon | ComponentType<any>;
    copyable?: boolean | string;
    copyLabel?: string;
    mono?: boolean;
    badge?: ReactNode;
    action?: ReactNode;
    className?: string;
    labelClassName?: string;
    valueClassName?: string;
    variant?: 'stacked' | 'horizontal' | 'card';
};

export function DetailItem({
    label,
    value,
    children,
    icon: IconComponent,
    copyable,
    copyLabel,
    mono = false,
    badge,
    action,
    className,
    labelClassName,
    valueClassName,
    variant = 'stacked',
}: DetailItemProps) {
    const displayContent = value ?? children;
    const copyTarget =
        typeof copyable === 'string'
            ? copyable
            : typeof displayContent === 'string' ||
                typeof displayContent === 'number'
              ? String(displayContent)
              : '';

    const handleCopy = () => {
        if (copyTarget) {
            const defaultLabel =
                typeof label === 'string' ? label : 'Informasi';
            void copyToClipboard(copyTarget, copyLabel ?? defaultLabel);
        }
    };

    if (variant === 'card') {
        return (
            <div
                className={cn(
                    'rounded-xl border bg-card p-3.5 shadow-xs transition-colors hover:bg-accent/20',
                    className,
                )}
            >
                <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                        {IconComponent && (
                            <div className="mt-0.5 shrink-0 rounded-lg bg-primary/10 p-2 text-primary">
                                <IconComponent
                                    className="size-4"
                                    weight="bold"
                                />
                            </div>
                        )}
                        <div className="min-w-0 flex-1">
                            <div
                                className={cn(
                                    'text-xs font-medium text-muted-foreground',
                                    labelClassName,
                                )}
                            >
                                {label}
                            </div>
                            <div
                                className={cn(
                                    'mt-0.5 text-sm font-semibold break-words text-foreground',
                                    mono && 'font-mono',
                                    valueClassName,
                                )}
                            >
                                {displayContent ?? (
                                    <span className="font-normal text-muted-foreground">
                                        Belum diisi
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    {(Boolean(copyable) || action) && (
                        <div className="flex items-center gap-1.5 shrink-0">
                            {action}
                            {Boolean(copyable) && copyTarget && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="size-8"
                                    onClick={handleCopy}
                                    title={`Salin ${typeof label === 'string' ? label : ''}`}
                                >
                                    <CopyIcon className="size-4" />
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (variant === 'horizontal') {
        return (
            <div
                className={cn(
                    'flex items-center justify-between gap-3 py-1.5',
                    className,
                )}
            >
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {IconComponent && (
                        <IconComponent className="size-4 shrink-0" />
                    )}
                    <span className={labelClassName}>{label}</span>
                </div>
                <div className="flex items-center gap-2">
                    <div
                        className={cn(
                            'text-sm font-medium text-foreground',
                            mono && 'font-mono',
                            valueClassName,
                        )}
                    >
                        {displayContent ?? '-'}
                    </div>
                    {badge}
                    {Boolean(copyable) && copyTarget && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-6 p-0"
                            onClick={handleCopy}
                            title={`Salin ${typeof label === 'string' ? label : ''}`}
                        >
                            <CopyIcon className="size-3.5" />
                        </Button>
                    )}
                    {action}
                </div>
            </div>
        );
    }

    return (
        <div className={cn('space-y-1', className)}>
            <div
                className={cn(
                    'flex items-center gap-1.5 text-xs text-muted-foreground',
                    labelClassName,
                )}
            >
                {IconComponent && <IconComponent className="size-3.5" />}
                <span>{label}</span>
            </div>
            <div className="flex items-center gap-2">
                <div
                    className={cn(
                        'text-sm font-semibold break-words text-foreground',
                        mono && 'font-mono',
                        valueClassName,
                    )}
                >
                    {displayContent ?? (
                        <span className="font-normal text-muted-foreground">
                            -
                        </span>
                    )}
                </div>
                {badge}
                {Boolean(copyable) && copyTarget && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-6 p-0"
                        onClick={handleCopy}
                        title={`Salin ${typeof label === 'string' ? label : ''}`}
                    >
                        <CopyIcon className="size-3.5" />
                    </Button>
                )}
                {action}
            </div>
        </div>
    );
}

export function DataRow(props: Omit<DetailItemProps, 'variant'>) {
    return <DetailItem variant="horizontal" {...props} />;
}


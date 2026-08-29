import {
    CheckCircleIcon,
    ClockCountdownIcon,
    WarningCircleIcon,
} from '@phosphor-icons/react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getTaxCountdownInfo } from '@/pages/cars/vehicle-document-utils';
import type { TaxCountdownInfo } from '@/pages/cars/vehicle-document-utils';

type Props = {
    date: string | null | undefined;
    prefixLabel?: string;
    showIcon?: boolean;
    compact?: boolean;
    className?: string;
};

export function TaxCountdownBadge({
    date,
    prefixLabel,
    showIcon = true,
    compact = false,
    className,
}: Props) {
    const info: TaxCountdownInfo = getTaxCountdownInfo(date);

    if (info.status === 'none') {
        return (
            <Badge
                variant="outline"
                className={cn('text-xs text-muted-foreground', className)}
            >
                {prefixLabel ? `${prefixLabel}: ` : ''}Belum diatur
            </Badge>
        );
    }

    const Icon =
        info.status === 'expired'
            ? WarningCircleIcon
            : info.status === 'due_today' || info.status === 'due_soon'
              ? ClockCountdownIcon
              : CheckCircleIcon;

    const displayLabel = compact ? info.badgeLabel : info.label;

    return (
        <Badge
            variant="outline"
            className={cn(
                'inline-flex items-center gap-1 text-xs font-medium',
                info.className,
                className,
            )}
        >
            {showIcon && <Icon className="size-3.5 shrink-0" weight="bold" />}
            <span>
                {prefixLabel ? `${prefixLabel}: ` : ''}
                {displayLabel}
            </span>
        </Badge>
    );
}

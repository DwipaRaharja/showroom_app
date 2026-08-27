import { Link } from '@inertiajs/react';
import {
    ArrowRightIcon,
    CheckCircleIcon,
    ClockCountdownIcon,
    CurrencyCircleDollarIcon,
    FileTextIcon,
    KeyIcon,
    WarningCircleIcon,
} from '@phosphor-icons/react';
import type { Icon } from '@phosphor-icons/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { AttentionItem, DashboardSeverity } from '@/pages/dashboard/types';

const currencyFormatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
});

const severityClasses: Record<DashboardSeverity, string> = {
    danger: 'border-red-500/30 bg-red-500/10 text-red-500',
    warning:
        'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
    info: 'border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300',
};

function parseLocalDate(value: string): Date {
    return new Date(`${value.slice(0, 10)}T00:00:00`);
}

function itemIcon(kind: string): Icon {
    if (kind.includes('payment') || kind.includes('shortfall')) {
        return CurrencyCircleDollarIcon;
    }

    if (kind.includes('finance')) {
        return ClockCountdownIcon;
    }

    if (kind.includes('handover') || kind.includes('bpkb')) {
        return KeyIcon;
    }

    if (kind.includes('document')) {
        return FileTextIcon;
    }

    return WarningCircleIcon;
}

type Props = {
    title: string;
    description: string;
    items: AttentionItem[];
    emptyText: string;
};

export function AttentionCard({ title, description, items, emptyText }: Props) {
    return (
        <Card className="min-w-0 gap-0 overflow-hidden py-0">
            <CardHeader className="border-b px-5 py-5">
                <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                        <CardTitle>{title}</CardTitle>
                        <CardDescription>{description}</CardDescription>
                    </div>
                    <Badge variant="secondary">{items.length}</Badge>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                {items.length === 0 ? (
                    <div className="flex min-h-44 flex-col items-center justify-center gap-2 px-6 text-center">
                        <div className="flex size-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                            <CheckCircleIcon className="size-5" weight="fill" />
                        </div>
                        <p className="text-sm font-medium">Semua terkendali</p>
                        <p className="max-w-sm text-xs text-muted-foreground">
                            {emptyText}
                        </p>
                    </div>
                ) : (
                    <div className="divide-y">
                        {items.map((item) => {
                            const ItemIcon = itemIcon(item.kind);

                            return (
                                <div
                                    key={item.id}
                                    className="flex items-start gap-3 px-5 py-4"
                                >
                                    <div
                                        className={cn(
                                            'mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border',
                                            severityClasses[item.severity],
                                        )}
                                    >
                                        <ItemIcon className="size-4" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                                            <div>
                                                <p className="text-sm font-semibold">
                                                    {item.title}
                                                </p>
                                                <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                                                    {item.description}
                                                </p>
                                            </div>
                                            {item.amount !== null && (
                                                <span
                                                    className={cn(
                                                        'text-sm font-semibold tabular-nums',
                                                        item.severity ===
                                                            'danger' &&
                                                            'text-red-500',
                                                    )}
                                                >
                                                    {currencyFormatter.format(
                                                        item.amount,
                                                    )}
                                                </span>
                                            )}
                                        </div>
                                        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                                            {item.date ? (
                                                <span className="text-xs text-muted-foreground">
                                                    Tanggal:{' '}
                                                    {dateFormatter.format(
                                                        parseLocalDate(
                                                            item.date,
                                                        ),
                                                    )}
                                                </span>
                                            ) : (
                                                <span />
                                            )}
                                            <Button
                                                asChild
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 px-2 text-xs"
                                            >
                                                <Link href={item.href}>
                                                    {item.action_label}
                                                    <ArrowRightIcon />
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

import { Link } from '@inertiajs/react';
import { ArrowLeftIcon } from '@phosphor-icons/react';
import type { ComponentProps, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Props = Omit<ComponentProps<'header'>, 'title'> & {
    title: ReactNode;
    description?: ReactNode;
    leading?: ReactNode;
    backHref?: string;
    backLabel?: string;
    titleAddon?: ReactNode;
    actions?: ReactNode;
    titleClassName?: string;
};

export function PageHeader({
    title,
    description,
    leading,
    backHref,
    backLabel = 'Kembali',
    titleAddon,
    actions,
    titleClassName,
    className,
    ...props
}: Props) {
    const leadingContent =
        leading ??
        (backHref ? (
            <Button
                variant="outline"
                size="icon"
                className="mt-0.5 shrink-0"
                asChild
            >
                <Link href={backHref} aria-label={backLabel}>
                    <ArrowLeftIcon className="size-4" />
                </Link>
            </Button>
        ) : null);

    return (
        <header
            className={cn(
                'flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between',
                className,
            )}
            {...props}
        >
            <div className="flex min-w-0 items-start gap-3">
                {leadingContent}
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <h1
                            className={cn(
                                'text-2xl font-semibold tracking-tight',
                                titleClassName,
                            )}
                        >
                            {title}
                        </h1>
                        {titleAddon}
                    </div>
                    {description && (
                        <div className="mt-1 text-sm text-muted-foreground">
                            {description}
                        </div>
                    )}
                </div>
            </div>
            {actions && (
                <div className="flex flex-wrap items-center gap-2">
                    {actions}
                </div>
            )}
        </header>
    );
}

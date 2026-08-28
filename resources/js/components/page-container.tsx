import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

export function PageContainer({ className, ...props }: ComponentProps<'div'>) {
    return (
        <div
            className={cn(
                'flex h-full min-w-0 flex-1 flex-col gap-6 p-4 md:p-6',
                className,
            )}
            {...props}
        />
    );
}

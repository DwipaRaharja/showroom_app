import type { ReactNode } from 'react';

type Props = {
    search: ReactNode;
    children?: ReactNode;
};

export function DataTableToolbar({ search, children }: Props) {
    return (
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
            {search}
            {children && (
                <div className="flex flex-wrap items-center gap-2">
                    {children}
                </div>
            )}
        </div>
    );
}

import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Props = {
    title: string;
    description: ReactNode;
    actions?: ReactNode;
    toolbar?: ReactNode;
    children: ReactNode;
    footer?: ReactNode;
};

export function DataTableShell({
    title,
    description,
    actions,
    toolbar,
    children,
    footer,
}: Props) {
    return (
        <Card className="min-w-0 gap-0 overflow-hidden py-0">
            <CardHeader className="gap-4 border-b px-4 py-5 sm:px-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <CardTitle>{title}</CardTitle>
                        <div className="text-sm text-muted-foreground">
                            {description}
                        </div>
                    </div>
                    {actions && (
                        <div className="flex flex-wrap items-center gap-3">
                            {actions}
                        </div>
                    )}
                </div>
                {toolbar}
            </CardHeader>
            <CardContent className="p-0">
                {children}
                {footer}
            </CardContent>
        </Card>
    );
}

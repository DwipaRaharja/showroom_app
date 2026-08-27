import { TableCell, TableRow } from '@/components/ui/table';

type Props = {
    colSpan: number;
    title: string;
    description: string;
};

export function DataTableEmptyState({ colSpan, title, description }: Props) {
    return (
        <TableRow>
            <TableCell colSpan={colSpan} className="h-32 text-center">
                <div className="space-y-1">
                    <p className="font-medium">{title}</p>
                    <p className="text-sm text-muted-foreground">
                        {description}
                    </p>
                </div>
            </TableCell>
        </TableRow>
    );
}

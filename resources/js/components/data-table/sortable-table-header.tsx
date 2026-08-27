import {
    CaretDownIcon,
    CaretUpDownIcon,
    CaretUpIcon,
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';

type Props = {
    label: string;
    isSorted: false | 'asc' | 'desc';
    onToggle: ((event: unknown) => void) | undefined;
};

export function SortableTableHeader({ label, isSorted, onToggle }: Props) {
    return (
        <Button
            variant="ghost"
            size="sm"
            className="-ml-2 h-8 px-2"
            onClick={onToggle}
            aria-label={`Urutkan berdasarkan ${label}`}
            aria-sort={
                isSorted === 'asc'
                    ? 'ascending'
                    : isSorted === 'desc'
                      ? 'descending'
                      : 'none'
            }
        >
            {label}
            {isSorted === 'asc' ? (
                <CaretUpIcon className="size-4" />
            ) : isSorted === 'desc' ? (
                <CaretDownIcon className="size-4" />
            ) : (
                <CaretUpDownIcon className="size-4 opacity-60" />
            )}
        </Button>
    );
}

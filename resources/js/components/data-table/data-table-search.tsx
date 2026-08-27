import { MagnifyingGlassIcon } from '@phosphor-icons/react';
import { Input } from '@/components/ui/input';

type Props = {
    value: string;
    onValueChange: (value: string) => void;
    placeholder: string;
    ariaLabel: string;
};

export function DataTableSearch({
    value,
    onValueChange,
    placeholder,
    ariaLabel,
}: Props) {
    return (
        <div className="relative flex-1 lg:max-w-sm">
            <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
                value={value}
                onChange={(event) => onValueChange(event.target.value)}
                placeholder={placeholder}
                className="pl-9"
                aria-label={ariaLabel}
            />
        </div>
    );
}

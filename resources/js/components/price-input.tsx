import type { ComponentProps } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const priceFormatter = new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 0,
});

type PriceInputProps = Omit<
    ComponentProps<typeof Input>,
    'defaultValue' | 'name' | 'onChange' | 'type' | 'value'
> & {
    name: string;
    value: string;
    onValueChange: (value: string) => void;
};

function normalizePrice(value: string): string {
    return value.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
}

function formatPrice(value: string): string {
    return value === '' ? '' : priceFormatter.format(BigInt(value));
}

export function PriceInput({
    className,
    disabled,
    name,
    onValueChange,
    value,
    ...props
}: PriceInputProps) {
    const normalizedValue = normalizePrice(value);

    return (
        <div className="relative">
            <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm font-medium text-muted-foreground"
            >
                Rp
            </span>
            <Input
                {...props}
                type="text"
                inputMode="numeric"
                autoComplete="off"
                disabled={disabled}
                value={formatPrice(normalizedValue)}
                onChange={(event) =>
                    onValueChange(normalizePrice(event.target.value))
                }
                className={cn('pl-10 tabular-nums', className)}
            />
            <input
                type="hidden"
                name={name}
                value={normalizedValue}
                disabled={disabled}
            />
        </div>
    );
}

import type { ComponentProps } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const mileageFormatter = new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 0,
});

type MileageInputProps = Omit<
    ComponentProps<typeof Input>,
    'defaultValue' | 'name' | 'onChange' | 'type' | 'value'
> & {
    name: string;
    value: string;
    onValueChange: (value: string) => void;
    unit?: string;
};

function normalizeMileage(value: string): string {
    return value.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
}

function formatMileage(value: string): string {
    return value === '' ? '' : mileageFormatter.format(BigInt(value));
}

export function MileageInput({
    className,
    disabled,
    name,
    onValueChange,
    unit = 'km',
    value,
    ...props
}: MileageInputProps) {
    const normalizedValue = normalizeMileage(value);

    return (
        <div className="relative">
            <Input
                {...props}
                type="text"
                inputMode="numeric"
                autoComplete="off"
                disabled={disabled}
                value={formatMileage(normalizedValue)}
                onChange={(event) =>
                    onValueChange(normalizeMileage(event.target.value))
                }
                className={cn(unit ? 'pr-12 tabular-nums' : 'tabular-nums', className)}
            />
            {unit && (
                <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm font-medium text-muted-foreground"
                >
                    {unit}
                </span>
            )}
            <input
                type="hidden"
                name={name}
                value={normalizedValue}
                disabled={disabled}
            />
        </div>
    );
}

/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';

type Props = {
    id?: string;
    name?: string;
    value?: string;
    onChange?: (value: string) => void;
    placeholderPrefix?: string;
    placeholderNumber?: string;
    placeholderSuffix?: string;
    className?: string;
    'aria-invalid'?: boolean;
    required?: boolean;
};

export function LicensePlateInput({
    id,
    name,
    value = '',
    onChange,
    placeholderPrefix = 'B / KT',
    placeholderNumber = '1234',
    placeholderSuffix = 'ABC',
    className = '',
    'aria-invalid': ariaInvalid,
    required,
}: Props) {
    const initialParts = value.trim().split(/\s+/);
    const [prefix, setPrefix] = useState(initialParts[0] ?? '');
    const [number, setNumber] = useState(initialParts[1] ?? '');
    const [suffix, setSuffix] = useState(initialParts[2] ?? '');

    // Sync from prop changes if value changes from outside
    useEffect(() => {
        const parts = value.trim().split(/\s+/);
        setPrefix(parts[0] ?? '');
        setNumber(parts[1] ?? '');
        setSuffix(parts[2] ?? '');
    }, [value]);

    function notifyChange(
        newPrefix: string,
        newNumber: string,
        newSuffix: string,
    ) {
        if (!onChange) {
            return;
        }

        const combined = `${newPrefix} ${newNumber} ${newSuffix}`
            .trim()
            .replace(/\s{2,}/g, ' ');
        onChange(combined);
    }

    return (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            <input type="hidden" name={name} value={value} />
            <div className="space-y-1">
                <Input
                    id={id ? `${id}-prefix` : undefined}
                    value={prefix}
                    onChange={(e) => {
                        const newPrefix = e.target.value
                            .replace(/[^a-zA-Z]/g, '')
                            .toUpperCase();
                        setPrefix(newPrefix);
                        notifyChange(newPrefix, number, suffix);
                    }}
                    placeholder={placeholderPrefix}
                    maxLength={2}
                    className={`text-center font-mono font-bold tracking-wider ${className}`}
                    aria-invalid={ariaInvalid}
                    required={required}
                />
                <span className="block text-center text-[11px] text-muted-foreground">
                    Wilayah
                </span>
            </div>

            <div className="space-y-1 sm:col-span-2">
                <Input
                    id={id ? `${id}-number` : undefined}
                    value={number}
                    onChange={(e) => {
                        const newNumber = e.target.value.replace(/[^0-9]/g, '');
                        setNumber(newNumber);
                        notifyChange(prefix, newNumber, suffix);
                    }}
                    placeholder={placeholderNumber}
                    maxLength={4}
                    inputMode="numeric"
                    className={`text-center font-mono font-bold tracking-wider ${className}`}
                    aria-invalid={ariaInvalid}
                    required={required}
                />
                <span className="block text-center text-[11px] text-muted-foreground">
                    Nomor Polisi
                </span>
            </div>

            <div className="space-y-1">
                <Input
                    id={id ? `${id}-suffix` : undefined}
                    value={suffix}
                    onChange={(e) => {
                        const newSuffix = e.target.value
                            .replace(/[^a-zA-Z]/g, '')
                            .toUpperCase();
                        setSuffix(newSuffix);
                        notifyChange(prefix, number, newSuffix);
                    }}
                    placeholder={placeholderSuffix}
                    maxLength={3}
                    className={`text-center font-mono font-bold tracking-wider ${className}`}
                    aria-invalid={ariaInvalid}
                />
                <span className="block text-center text-[11px] text-muted-foreground">
                    Seri
                </span>
            </div>
        </div>
    );
}

import type { ReactNode } from 'react';
import InputError from '@/components/input-error';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export type FormGroupProps = {
    id?: string;
    label?: ReactNode;
    required?: boolean;
    error?: string;
    description?: ReactNode;
    children: ReactNode;
    className?: string;
};

export function FormGroup({
    id,
    label,
    required,
    error,
    description,
    children,
    className,
}: FormGroupProps) {
    return (
        <div className={cn('grid gap-1.5', className)}>
            {label && (
                <Label htmlFor={id}>
                    {label}
                    {required && <span className="ml-1 text-red-500">*</span>}
                </Label>
            )}

            {children}

            {description && !error && (
                <p className="text-xs text-muted-foreground">{description}</p>
            )}

            <InputError
                message={error}
                className="text-red-500 dark:text-red-500"
            />
        </div>
    );
}

// Common validation color class to be applied to inputs
export const inputValidationClass =
    'aria-invalid:border-red-500 aria-invalid:ring-red-500/20 dark:aria-invalid:ring-red-500/40';

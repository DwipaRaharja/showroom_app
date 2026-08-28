import { Form } from '@inertiajs/react';
import {
    CheckCircleIcon,
    type Icon,
    WarningIcon,
} from '@phosphor-icons/react';
import type { ComponentProps, ComponentType, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

export type ConfirmDialogTone = 'danger' | 'success' | 'warning' | 'info';

const toneConfig: Record<
    ConfirmDialogTone,
    {
        iconBox: string;
        defaultIcon: Icon;
        confirmButtonVariant: 'default' | 'destructive' | 'outline';
        confirmButtonClass?: string;
    }
> = {
    danger: {
        iconBox: 'bg-red-500/10 text-red-500',
        defaultIcon: WarningIcon,
        confirmButtonVariant: 'destructive',
        confirmButtonClass:
            'bg-red-500 hover:bg-red-500/90 focus-visible:ring-red-500/20 dark:bg-red-500 dark:hover:bg-red-500/90 dark:focus-visible:ring-red-500/40',
    },
    success: {
        iconBox: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
        defaultIcon: CheckCircleIcon,
        confirmButtonVariant: 'default',
        confirmButtonClass:
            'bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-500/20 dark:bg-emerald-600 dark:text-white dark:hover:bg-emerald-700',
    },
    warning: {
        iconBox: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
        defaultIcon: WarningIcon,
        confirmButtonVariant: 'default',
        confirmButtonClass:
            'bg-amber-600 text-white hover:bg-amber-700 focus-visible:ring-amber-500/20 dark:bg-amber-600 dark:text-white dark:hover:bg-amber-700',
    },
    info: {
        iconBox: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
        defaultIcon: CheckCircleIcon,
        confirmButtonVariant: 'default',
        confirmButtonClass:
            'bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500/20 dark:bg-blue-600 dark:text-white dark:hover:bg-blue-700',
    },
};

export type ConfirmDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: ReactNode;
    description: ReactNode;
    tone?: ConfirmDialogTone;
    icon?: Icon | ComponentType<any>;
    confirmText?: string;
    cancelText?: string;
    confirmIcon?: Icon | ComponentType<any>;
    formProps?: Omit<ComponentProps<typeof Form>, 'children'>;
    onConfirm?: () => void;
    processing?: boolean;
    children?: ReactNode;
};

export function ConfirmDialog({
    open,
    onOpenChange,
    title,
    description,
    tone = 'danger',
    icon,
    confirmText = 'Konfirmasi',
    cancelText = 'Batal',
    confirmIcon: ConfirmIconComponent,
    formProps,
    onConfirm,
    processing = false,
    children,
}: ConfirmDialogProps) {
    const config = toneConfig[tone];
    const HeaderIcon = icon ?? config.defaultIcon;

    const renderFooter = (isProcessing: boolean) => (
        <DialogFooter className="gap-2 sm:gap-2">
            <DialogClose asChild>
                <Button
                    type="button"
                    variant="outline"
                    disabled={isProcessing}
                >
                    {cancelText}
                </Button>
            </DialogClose>
            {confirmText && (
                <Button
                    type={formProps ? 'submit' : 'button'}
                    variant={config.confirmButtonVariant}
                    className={config.confirmButtonClass}
                    disabled={isProcessing}
                    onClick={onConfirm}
                >
                    {isProcessing ? (
                        <Spinner />
                    ) : (
                        ConfirmIconComponent && (
                            <ConfirmIconComponent className="size-4" />
                        )
                    )}
                    {confirmText}
                </Button>
            )}
        </DialogFooter>
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <div
                        className={cn(
                            'mb-1 flex size-10 items-center justify-center rounded-full',
                            config.iconBox,
                        )}
                    >
                        <HeaderIcon className="size-5" weight="fill" />
                    </div>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>

                {children}

                {formProps ? (
                    <Form
                        {...formProps}
                        options={{
                            preserveScroll: true,
                            ...formProps.options,
                        }}
                        onSuccess={(page) => {
                            onOpenChange(false);
                            formProps.onSuccess?.(page);
                        }}
                    >
                        {({ processing: formProcessing }) =>
                            renderFooter(formProcessing || processing)
                        }
                    </Form>
                ) : (
                    !children && renderFooter(processing)
                )}
            </DialogContent>
        </Dialog>
    );
}

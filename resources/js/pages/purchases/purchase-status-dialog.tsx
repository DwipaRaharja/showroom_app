import { Form } from '@inertiajs/react';
import {
    CheckCircleIcon,
    FileTextIcon,
    FloppyDiskIcon,
    XCircleIcon,
} from '@phosphor-icons/react';
import { useState } from 'react';
import PurchaseController from '@/actions/App/Http/Controllers/PurchaseController';
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
import type { Purchase, PurchaseStatus } from '@/pages/purchases/types';

type Props = {
    purchase: Purchase | null;
    onOpenChange: (open: boolean) => void;
};

const statusOptions: {
    value: PurchaseStatus;
    label: string;
    description: string;
    icon: typeof CheckCircleIcon;
    colorClass: string;
}[] = [
    {
        value: 'draft',
        label: 'Draft',
        description: 'Rincian modal masih disiapkan dan belum disinkronkan.',
        icon: FileTextIcon,
        colorClass: 'text-amber-600 dark:text-amber-500',
    },
    {
        value: 'completed',
        label: 'Aktif',
        description: 'Total modal aktif dan disinkronkan ke data mobil.',
        icon: CheckCircleIcon,
        colorClass: 'text-emerald-600 dark:text-emerald-500',
    },
    {
        value: 'cancelled',
        label: 'Dibatalkan',
        description: 'Catatan modal dibatalkan dan tidak digunakan.',
        icon: XCircleIcon,
        colorClass: 'text-red-500',
    },
];

function PurchaseStatusContent({
    purchase,
    onOpenChange,
}: {
    purchase: Purchase;
    onOpenChange: (open: boolean) => void;
}) {
    const [status, setStatus] = useState<PurchaseStatus>(purchase.status);

    return (
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Ubah Status Modal</DialogTitle>
                <DialogDescription>
                    Pilih status terbaru untuk{' '}
                    <strong>{purchase.purchase_number}</strong>.
                </DialogDescription>
            </DialogHeader>

            <Form
                {...PurchaseController.updateStatus.form(purchase.id)}
                options={{ preserveScroll: true }}
                onSuccess={() => onOpenChange(false)}
                className="space-y-4"
            >
                {({ processing }) => (
                    <>
                        <input type="hidden" name="status" value={status} />

                        <div className="space-y-2">
                            {statusOptions.map((option) => {
                                const Icon = option.icon;
                                const isSelected = status === option.value;

                                return (
                                    <button
                                        type="button"
                                        key={option.value}
                                        onClick={() => setStatus(option.value)}
                                        className={`flex w-full cursor-pointer items-start gap-3 rounded-lg border p-3 text-left transition-colors ${
                                            isSelected
                                                ? 'border-primary bg-primary/5 dark:bg-primary/10'
                                                : 'hover:bg-muted/50'
                                        }`}
                                    >
                                        <span
                                            className={`mt-0.5 ${option.colorClass}`}
                                        >
                                            <Icon
                                                className="size-5"
                                                weight={
                                                    isSelected
                                                        ? 'fill'
                                                        : 'regular'
                                                }
                                            />
                                        </span>
                                        <span className="flex-1">
                                            <span className="block text-sm font-medium">
                                                {option.label}
                                            </span>
                                            <span className="block text-xs text-muted-foreground">
                                                {option.description}
                                            </span>
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        <DialogFooter className="pt-2">
                            <DialogClose asChild>
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={processing}
                                >
                                    Batal
                                </Button>
                            </DialogClose>
                            <Button type="submit" disabled={processing}>
                                {processing ? <Spinner /> : <FloppyDiskIcon />}
                                Simpan status
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </Form>
        </DialogContent>
    );
}

export function PurchaseStatusDialog({ purchase, onOpenChange }: Props) {
    return (
        <Dialog open={purchase !== null} onOpenChange={onOpenChange}>
            {purchase && (
                <PurchaseStatusContent
                    purchase={purchase}
                    onOpenChange={onOpenChange}
                />
            )}
        </Dialog>
    );
}

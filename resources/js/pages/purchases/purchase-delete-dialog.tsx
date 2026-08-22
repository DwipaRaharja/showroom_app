import { Form } from '@inertiajs/react';
import { TrashIcon, WarningIcon } from '@phosphor-icons/react';
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
import type { Purchase } from '@/pages/purchases/types';

type Props = {
    purchase: Purchase | null;
    onOpenChange: (open: boolean) => void;
};

export function PurchaseDeleteDialog({ purchase, onOpenChange }: Props) {
    return (
        <Dialog open={purchase !== null} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <div className="mb-1 flex size-10 items-center justify-center rounded-full bg-red-500/10 text-red-500">
                        <WarningIcon className="size-5" weight="fill" />
                    </div>
                    <DialogTitle>Hapus data modal mobil?</DialogTitle>
                    <DialogDescription>
                        Data modal <strong>{purchase?.purchase_number}</strong>{' '}
                        akan dihapus permanen. Tindakan ini tidak dapat
                        dibatalkan.
                    </DialogDescription>
                </DialogHeader>

                {purchase && (
                    <Form
                        {...PurchaseController.destroy.form(purchase.id)}
                        options={{ preserveScroll: true }}
                        onSuccess={() => onOpenChange(false)}
                    >
                        {({ processing }) => (
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        disabled={processing}
                                    >
                                        Batal
                                    </Button>
                                </DialogClose>
                                <Button
                                    type="submit"
                                    variant="destructive"
                                    className="bg-red-500 hover:bg-red-500/90 focus-visible:ring-red-500/20 dark:bg-red-500 dark:hover:bg-red-500/90 dark:focus-visible:ring-red-500/40"
                                    disabled={processing}
                                >
                                    {processing ? <Spinner /> : <TrashIcon />}
                                    Hapus
                                </Button>
                            </DialogFooter>
                        )}
                    </Form>
                )}
            </DialogContent>
        </Dialog>
    );
}

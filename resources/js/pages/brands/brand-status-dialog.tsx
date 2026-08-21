import { Form } from '@inertiajs/react';
import { CheckCircleIcon, PowerIcon, WarningIcon } from '@phosphor-icons/react';
import BrandController from '@/actions/App/Http/Controllers/BrandController';
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
import type { Brand } from '@/pages/brands/types';

type Props = {
    brand: Brand | null;
    onOpenChange: (open: boolean) => void;
};

export function BrandStatusDialog({ brand, onOpenChange }: Props) {
    const willActivate = brand?.is_active === false;

    return (
        <Dialog
            open={brand !== null}
            onOpenChange={(open) => onOpenChange(open)}
        >
            <DialogContent>
                <DialogHeader>
                    <div
                        className={
                            willActivate
                                ? 'mb-1 flex size-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500'
                                : 'mb-1 flex size-10 items-center justify-center rounded-full bg-red-500/10 text-red-500'
                        }
                    >
                        {willActivate ? (
                            <CheckCircleIcon className="size-5" weight="fill" />
                        ) : (
                            <WarningIcon className="size-5" weight="fill" />
                        )}
                    </div>
                    <DialogTitle>
                        {willActivate
                            ? 'Aktifkan kembali merek?'
                            : 'Nonaktifkan merek?'}
                    </DialogTitle>
                    <DialogDescription>
                        {willActivate ? (
                            <>
                                Merek <strong>{brand?.name}</strong> akan dapat
                                digunakan kembali pada data kendaraan baru.
                            </>
                        ) : (
                            <>
                                Merek <strong>{brand?.name}</strong> tidak akan
                                dapat digunakan pada data kendaraan baru, tetapi
                                datanya tetap tersimpan.
                            </>
                        )}
                    </DialogDescription>
                </DialogHeader>

                {brand && (
                    <Form
                        {...BrandController.updateStatus.form(brand.id)}
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
                                    variant={
                                        willActivate ? 'default' : 'destructive'
                                    }
                                    className={
                                        willActivate
                                            ? undefined
                                            : 'bg-red-500 hover:bg-red-500/90 focus-visible:ring-red-500/20 dark:bg-red-500 dark:hover:bg-red-500/90 dark:focus-visible:ring-red-500/40'
                                    }
                                    disabled={processing}
                                >
                                    {processing ? (
                                        <Spinner />
                                    ) : willActivate ? (
                                        <CheckCircleIcon />
                                    ) : (
                                        <PowerIcon />
                                    )}
                                    {willActivate ? 'Aktifkan' : 'Nonaktifkan'}
                                </Button>
                            </DialogFooter>
                        )}
                    </Form>
                )}
            </DialogContent>
        </Dialog>
    );
}

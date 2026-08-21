import { Form } from '@inertiajs/react';
import {
    ArchiveBoxIcon,
    ArrowCounterClockwiseIcon,
    WarningIcon,
} from '@phosphor-icons/react';
import CustomerController from '@/actions/App/Http/Controllers/CustomerController';
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
import type { Customer } from '@/pages/customers/types';

type Props = {
    customer: Customer | null;
    onOpenChange: (open: boolean) => void;
};

export function CustomerStatusDialog({ customer, onOpenChange }: Props) {
    const willRestore = customer?.deleted_at !== null;
    const formDefinition = customer
        ? willRestore
            ? CustomerController.restore.form(customer.id)
            : CustomerController.destroy.form(customer.id)
        : null;

    return (
        <Dialog
            open={customer !== null}
            onOpenChange={(open) => onOpenChange(open)}
        >
            <DialogContent>
                <DialogHeader>
                    <div
                        className={
                            willRestore
                                ? 'mb-1 flex size-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500'
                                : 'mb-1 flex size-10 items-center justify-center rounded-full bg-red-500/10 text-red-500'
                        }
                    >
                        {willRestore ? (
                            <ArrowCounterClockwiseIcon
                                className="size-5"
                                weight="bold"
                            />
                        ) : (
                            <WarningIcon className="size-5" weight="fill" />
                        )}
                    </div>
                    <DialogTitle>
                        {willRestore
                            ? 'Pulihkan data customer?'
                            : 'Arsipkan data customer?'}
                    </DialogTitle>
                    <DialogDescription>
                        {willRestore ? (
                            <>
                                Data <strong>{customer?.name}</strong> akan
                                dikembalikan ke daftar customer aktif.
                            </>
                        ) : (
                            <>
                                Data <strong>{customer?.name}</strong> akan
                                dipindahkan ke arsip dan tidak muncul pada
                                daftar customer aktif. Data tidak dihapus
                                permanen.
                            </>
                        )}
                    </DialogDescription>
                </DialogHeader>

                {customer && formDefinition && (
                    <Form
                        {...formDefinition}
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
                                        willRestore ? 'default' : 'destructive'
                                    }
                                    className={
                                        willRestore
                                            ? undefined
                                            : 'bg-red-500 hover:bg-red-500/90 focus-visible:ring-red-500/20 dark:bg-red-500 dark:hover:bg-red-500/90 dark:focus-visible:ring-red-500/40'
                                    }
                                    disabled={processing}
                                >
                                    {processing ? (
                                        <Spinner />
                                    ) : willRestore ? (
                                        <ArrowCounterClockwiseIcon />
                                    ) : (
                                        <ArchiveBoxIcon />
                                    )}
                                    {willRestore ? 'Pulihkan' : 'Arsipkan'}
                                </Button>
                            </DialogFooter>
                        )}
                    </Form>
                )}
            </DialogContent>
        </Dialog>
    );
}

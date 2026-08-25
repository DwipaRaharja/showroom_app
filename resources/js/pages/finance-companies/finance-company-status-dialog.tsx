import { Form } from '@inertiajs/react';
import { CheckCircleIcon, PowerIcon, WarningIcon } from '@phosphor-icons/react';
import FinanceCompanyController from '@/actions/App/Http/Controllers/FinanceCompanyController';
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
import type { FinanceCompany } from '@/pages/finance-companies/types';

type Props = {
    company: FinanceCompany | null;
    onOpenChange: (open: boolean) => void;
};

export function FinanceCompanyStatusDialog({ company, onOpenChange }: Props) {
    const willActivate = company?.is_active === false;

    return (
        <Dialog
            open={company !== null}
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
                            ? 'Aktifkan rekanan leasing?'
                            : 'Nonaktifkan rekanan leasing?'}
                    </DialogTitle>
                    <DialogDescription>
                        {willActivate ? (
                            <>
                                Rekanan <strong>{company?.name}</strong> akan
                                dapat dipilih kembali pada transaksi penjualan
                                kredit.
                            </>
                        ) : (
                            <>
                                Rekanan <strong>{company?.name}</strong> tidak
                                akan muncul pada pilihan penjualan kredit baru,
                                namun data riwayat transaksi sebelumnya tetap
                                aman tersimpan.
                            </>
                        )}
                    </DialogDescription>
                </DialogHeader>

                {company && (
                    <Form
                        {...FinanceCompanyController.updateStatus.form(
                            company.id,
                        )}
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
                                    className={
                                        willActivate
                                            ? 'bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700'
                                            : 'bg-red-500 text-white hover:bg-red-500/90 hover:text-white dark:bg-red-500 dark:text-white dark:hover:bg-red-500/90 dark:hover:text-white'
                                    }
                                    disabled={processing}
                                >
                                    {processing ? (
                                        <>
                                            <Spinner className="mr-1.5 size-4" />
                                            Memproses...
                                        </>
                                    ) : willActivate ? (
                                        <>
                                            <CheckCircleIcon
                                                className="mr-1.5 size-4"
                                                weight="bold"
                                            />
                                            Aktifkan Rekanan
                                        </>
                                    ) : (
                                        <>
                                            <PowerIcon
                                                className="mr-1.5 size-4"
                                                weight="bold"
                                            />
                                            Nonaktifkan Rekanan
                                        </>
                                    )}
                                </Button>
                            </DialogFooter>
                        )}
                    </Form>
                )}
            </DialogContent>
        </Dialog>
    );
}

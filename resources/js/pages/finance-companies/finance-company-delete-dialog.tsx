import { Form } from '@inertiajs/react';
import { TrashIcon, WarningIcon } from '@phosphor-icons/react';
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

export function FinanceCompanyDeleteDialog({ company, onOpenChange }: Props) {
    const hasSales = (company?.sales_count ?? 0) > 0;

    return (
        <Dialog
            open={company !== null}
            onOpenChange={(open) => onOpenChange(open)}
        >
            <DialogContent>
                <DialogHeader>
                    <div className="mb-1 flex size-10 items-center justify-center rounded-full bg-red-500/10 text-red-500">
                        <WarningIcon className="size-5" weight="fill" />
                    </div>
                    <DialogTitle>Hapus Perusahaan Leasing?</DialogTitle>
                    <DialogDescription>
                        {hasSales ? (
                            <>
                                Rekanan <strong>{company?.name}</strong> telah
                                memiliki{' '}
                                <strong>
                                    {company?.sales_count} transaksi penjualan
                                </strong>{' '}
                                terkait. Perusahaan leasing ini tidak dapat
                                dihapus permanen. Silakan gunakan opsi
                                <strong> Nonaktifkan</strong> jika rekanan sudah
                                tidak bekerja sama.
                            </>
                        ) : (
                            <>
                                Apakah Anda yakin ingin menghapus data rekanan
                                leasing <strong>{company?.name}</strong>?
                                Tindakan ini tidak dapat dibatalkan.
                            </>
                        )}
                    </DialogDescription>
                </DialogHeader>

                {company && (
                    <Form
                        {...FinanceCompanyController.destroy.form(company.id)}
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
                                {!hasSales && (
                                    <Button
                                        type="submit"
                                        variant="destructive"
                                        className="bg-red-500 hover:bg-red-500/90 dark:bg-red-500 dark:hover:bg-red-500/90"
                                        disabled={processing}
                                    >
                                        {processing ? (
                                            <>
                                                <Spinner className="mr-1.5 size-4" />
                                                Menghapus...
                                            </>
                                        ) : (
                                            <>
                                                <TrashIcon
                                                    className="mr-1.5 size-4"
                                                    weight="bold"
                                                />
                                                Hapus Permanen
                                            </>
                                        )}
                                    </Button>
                                )}
                            </DialogFooter>
                        )}
                    </Form>
                )}
            </DialogContent>
        </Dialog>
    );
}

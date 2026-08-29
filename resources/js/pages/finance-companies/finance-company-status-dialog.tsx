import { CheckCircleIcon, PowerIcon } from '@phosphor-icons/react';
import FinanceCompanyController from '@/actions/App/Http/Controllers/FinanceCompanyController';
import { ConfirmDialog } from '@/components/confirm-dialog';
import type { FinanceCompany } from '@/pages/finance-companies/types';

type Props = {
    company: FinanceCompany | null;
    onOpenChange: (open: boolean) => void;
};

export function FinanceCompanyStatusDialog({ company, onOpenChange }: Props) {
    const willActivate = company?.is_active === false;

    return (
        <ConfirmDialog
            open={company !== null}
            onOpenChange={onOpenChange}
            tone={willActivate ? 'success' : 'danger'}
            title={
                willActivate
                    ? 'Aktifkan rekanan leasing?'
                    : 'Nonaktifkan rekanan leasing?'
            }
            description={
                willActivate ? (
                    <>
                        Rekanan <strong>{company?.name}</strong> akan dapat
                        dipilih kembali pada transaksi penjualan kredit.
                    </>
                ) : (
                    <>
                        Rekanan <strong>{company?.name}</strong> tidak akan
                        muncul pada pilihan penjualan kredit baru, namun data
                        riwayat transaksi sebelumnya tetap aman tersimpan.
                    </>
                )
            }
            confirmText={
                willActivate ? 'Aktifkan Rekanan' : 'Nonaktifkan Rekanan'
            }
            confirmIcon={willActivate ? CheckCircleIcon : PowerIcon}
            formProps={
                company
                    ? FinanceCompanyController.updateStatus.form(company.id)
                    : undefined
            }
        />
    );
}

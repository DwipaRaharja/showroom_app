import { TrashIcon } from '@phosphor-icons/react';
import FinanceCompanyController from '@/actions/App/Http/Controllers/FinanceCompanyController';
import { ConfirmDialog } from '@/components/confirm-dialog';
import type { FinanceCompany } from '@/pages/finance-companies/types';

type Props = {
    company: FinanceCompany | null;
    onOpenChange: (open: boolean) => void;
};

export function FinanceCompanyDeleteDialog({ company, onOpenChange }: Props) {
    const hasSales = (company?.sales_count ?? 0) > 0;

    return (
        <ConfirmDialog
            open={company !== null}
            onOpenChange={onOpenChange}
            tone={hasSales ? 'warning' : 'danger'}
            title={hasSales ? 'Tindakan Ditolak' : 'Hapus Perusahaan Leasing?'}
            description={
                hasSales ? (
                    <>
                        Rekanan <strong>{company?.name}</strong> telah memiliki{' '}
                        <strong>
                            {company?.sales_count} riwayat transaksi penjualan
                        </strong>
                        . Data yang sudah memiliki relasi riwayat tidak dapat dihapus permanen. Silakan gunakan opsi
                        <strong> Nonaktifkan</strong> jika rekanan ini sudah tidak
                        bekerja sama.
                    </>
                ) : (
                    <>
                        Apakah Anda yakin ingin menghapus data rekanan leasing{' '}
                        <strong>{company?.name}</strong>? Tindakan ini tidak
                        dapat dibatalkan.
                    </>
                )
            }
            confirmText={hasSales ? undefined : 'Hapus Permanen'}
            confirmIcon={hasSales ? undefined : TrashIcon}
            cancelText={hasSales ? 'Mengerti' : 'Batal'}
            formProps={
                company && !hasSales
                    ? FinanceCompanyController.destroy.form(company.id)
                    : undefined
            }
        />
    );
}

import { TrashIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import FinanceCompanyController from '@/actions/App/Http/Controllers/FinanceCompanyController';
import { ConfirmDialog } from '@/components/confirm-dialog';
import type { FinanceCompany } from '@/pages/finance-companies/types';

type Props = {
    company: FinanceCompany | null;
    onOpenChange: (open: boolean) => void;
};

export function FinanceCompanyDeleteDialog({ company, onOpenChange }: Props) {
    const [prevCompany, setPrevCompany] = useState<FinanceCompany | null>(
        company,
    );
    const [cachedCompany, setCachedCompany] = useState<FinanceCompany | null>(
        company,
    );

    if (company !== prevCompany) {
        setPrevCompany(company);

        if (company !== null) {
            setCachedCompany(company);
        }
    }

    const activeCompany = company ?? cachedCompany;
    const hasSales = (activeCompany?.sales_count ?? 0) > 0;

    return (
        <ConfirmDialog
            open={company !== null}
            onOpenChange={onOpenChange}
            tone={hasSales ? 'warning' : 'danger'}
            title={hasSales ? 'Tindakan Ditolak' : 'Hapus Perusahaan Leasing?'}
            description={
                hasSales ? (
                    <>
                        Rekanan <strong>{activeCompany?.name}</strong> telah
                        memiliki{' '}
                        <strong>
                            {activeCompany?.sales_count} riwayat transaksi
                            penjualan
                        </strong>
                        . Data yang sudah memiliki relasi riwayat tidak dapat
                        dihapus permanen. Silakan gunakan opsi
                        <strong> Nonaktifkan</strong> jika rekanan ini sudah
                        tidak bekerja sama.
                    </>
                ) : (
                    <>
                        Apakah Anda yakin ingin menghapus data rekanan leasing{' '}
                        <strong>{activeCompany?.name}</strong>? Tindakan ini
                        tidak dapat dibatalkan.
                    </>
                )
            }
            confirmText={hasSales ? null : 'Hapus Permanen'}
            confirmIcon={hasSales ? undefined : TrashIcon}
            cancelText={hasSales ? 'Mengerti' : 'Batal'}
            formProps={
                activeCompany && !hasSales
                    ? FinanceCompanyController.destroy.form(activeCompany.id)
                    : undefined
            }
        />
    );
}

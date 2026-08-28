import {
    ArchiveBoxIcon,
    ArrowCounterClockwiseIcon,
} from '@phosphor-icons/react';
import CustomerController from '@/actions/App/Http/Controllers/CustomerController';
import { ConfirmDialog } from '@/components/confirm-dialog';
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
        : undefined;

    return (
        <ConfirmDialog
            open={customer !== null}
            onOpenChange={onOpenChange}
            tone={willRestore ? 'success' : 'danger'}
            icon={willRestore ? ArrowCounterClockwiseIcon : undefined}
            title={
                willRestore
                    ? 'Pulihkan data customer?'
                    : 'Arsipkan data customer?'
            }
            description={
                willRestore ? (
                    <>
                        Data <strong>{customer?.name}</strong> akan
                        dikembalikan ke daftar customer aktif.
                    </>
                ) : (
                    <>
                        Data <strong>{customer?.name}</strong> akan
                        dipindahkan ke arsip dan tidak muncul pada
                        daftar customer aktif. Data tidak dihapus permanen.
                    </>
                )
            }
            confirmText={willRestore ? 'Pulihkan' : 'Arsipkan'}
            confirmIcon={
                willRestore ? ArrowCounterClockwiseIcon : ArchiveBoxIcon
            }
            formProps={formDefinition}
        />
    );
}

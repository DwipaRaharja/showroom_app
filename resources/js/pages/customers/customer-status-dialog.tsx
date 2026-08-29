import {
    ArchiveBoxIcon,
    ArrowCounterClockwiseIcon,
} from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import CustomerController from '@/actions/App/Http/Controllers/CustomerController';
import { ConfirmDialog } from '@/components/confirm-dialog';
import type { Customer } from '@/pages/customers/types';

type Props = {
    customer: Customer | null;
    onOpenChange: (open: boolean) => void;
};

export function CustomerStatusDialog({ customer, onOpenChange }: Props) {
    const [cachedCustomer, setCachedCustomer] = useState<Customer | null>(
        customer,
    );

    useEffect(() => {
        if (customer !== null) {
            setCachedCustomer(customer);
        }
    }, [customer]);

    const activeCustomer = customer ?? cachedCustomer;
    const willRestore = activeCustomer?.deleted_at !== null;
    const formDefinition = activeCustomer
        ? willRestore
            ? CustomerController.restore.form(activeCustomer.id)
            : CustomerController.destroy.form(activeCustomer.id)
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
                        Data <strong>{activeCustomer?.name}</strong> akan
                        dikembalikan ke daftar customer aktif.
                    </>
                ) : (
                    <>
                        Data <strong>{activeCustomer?.name}</strong> akan
                        dipindahkan ke arsip dan tidak muncul pada daftar
                        customer aktif. Data tidak dihapus permanen.
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

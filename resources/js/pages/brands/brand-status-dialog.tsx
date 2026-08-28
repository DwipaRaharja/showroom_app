import { CheckCircleIcon, PowerIcon } from '@phosphor-icons/react';
import BrandController from '@/actions/App/Http/Controllers/BrandController';
import { ConfirmDialog } from '@/components/confirm-dialog';
import type { Brand } from '@/pages/brands/types';

type Props = {
    brand: Brand | null;
    onOpenChange: (open: boolean) => void;
};

export function BrandStatusDialog({ brand, onOpenChange }: Props) {
    const willActivate = brand?.is_active === false;

    return (
        <ConfirmDialog
            open={brand !== null}
            onOpenChange={onOpenChange}
            tone={willActivate ? 'success' : 'danger'}
            title={
                willActivate
                    ? 'Aktifkan kembali merek?'
                    : 'Nonaktifkan merek?'
            }
            description={
                willActivate ? (
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
                )
            }
            confirmText={willActivate ? 'Aktifkan' : 'Nonaktifkan'}
            confirmIcon={willActivate ? CheckCircleIcon : PowerIcon}
            formProps={
                brand ? BrandController.updateStatus.form(brand.id) : undefined
            }
        />
    );
}

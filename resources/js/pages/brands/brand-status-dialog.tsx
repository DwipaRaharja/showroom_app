import { CheckCircleIcon, PowerIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import BrandController from '@/actions/App/Http/Controllers/BrandController';
import { ConfirmDialog } from '@/components/confirm-dialog';
import type { Brand } from '@/pages/brands/types';

type Props = {
    brand: Brand | null;
    onOpenChange: (open: boolean) => void;
};

export function BrandStatusDialog({ brand, onOpenChange }: Props) {
    const [prevBrand, setPrevBrand] = useState<Brand | null>(brand);
    const [cachedBrand, setCachedBrand] = useState<Brand | null>(brand);

    if (brand !== prevBrand) {
        setPrevBrand(brand);

        if (brand !== null) {
            setCachedBrand(brand);
        }
    }

    const activeBrand = brand ?? cachedBrand;
    const willActivate = activeBrand?.is_active === false;

    return (
        <ConfirmDialog
            open={brand !== null}
            onOpenChange={onOpenChange}
            tone={willActivate ? 'success' : 'danger'}
            title={
                willActivate ? 'Aktifkan kembali merek?' : 'Nonaktifkan merek?'
            }
            description={
                willActivate ? (
                    <>
                        Merek <strong>{activeBrand?.name}</strong> akan dapat
                        digunakan kembali pada data kendaraan baru.
                    </>
                ) : (
                    <>
                        Merek <strong>{activeBrand?.name}</strong> tidak akan
                        dapat digunakan pada data kendaraan baru, tetapi datanya
                        tetap tersimpan.
                    </>
                )
            }
            confirmText={willActivate ? 'Aktifkan' : 'Nonaktifkan'}
            confirmIcon={willActivate ? CheckCircleIcon : PowerIcon}
            formProps={
                activeBrand
                    ? BrandController.updateStatus.form(activeBrand.id)
                    : undefined
            }
        />
    );
}

import { ArchiveBoxIcon } from '@phosphor-icons/react';
import CarController from '@/actions/App/Http/Controllers/CarController';
import { ConfirmDialog } from '@/components/confirm-dialog';
import type { Car } from '@/pages/cars/types';

type Props = {
    car: Car | null;
    onOpenChange: (open: boolean) => void;
};

export function CarDeleteDialog({ car, onOpenChange }: Props) {
    return (
        <ConfirmDialog
            open={car !== null}
            onOpenChange={onOpenChange}
            tone="danger"
            title="Arsipkan data mobil?"
            description={
                <>
                    Unit <strong>{car?.name}</strong>{' '}
                    {car?.license_plate && `(${car.license_plate})`} akan
                    disembunyikan dari daftar mobil aktif. Riwayat penjualan,
                    pembayaran, modal, dan dokumen kendaraan tetap tersimpan
                    sehingga data dapat dipulihkan.
                </>
            }
            confirmText="Arsipkan"
            confirmIcon={ArchiveBoxIcon}
            formProps={
                car ? CarController.destroy.form(car.id) : undefined
            }
        />
    );
}

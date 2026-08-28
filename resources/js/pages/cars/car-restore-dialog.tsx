import { ArrowCounterClockwiseIcon } from '@phosphor-icons/react';
import CarController from '@/actions/App/Http/Controllers/CarController';
import { ConfirmDialog } from '@/components/confirm-dialog';
import type { Car } from '@/pages/cars/types';

type Props = {
    car: Car | null;
    onOpenChange: (open: boolean) => void;
};

export function CarRestoreDialog({ car, onOpenChange }: Props) {
    return (
        <ConfirmDialog
            open={car !== null}
            onOpenChange={onOpenChange}
            tone="success"
            icon={ArrowCounterClockwiseIcon}
            title="Pulihkan data mobil?"
            description={
                <>
                    Unit <strong>{car?.name}</strong>{' '}
                    {car?.license_plate && `(${car.license_plate})`} akan
                    dikembalikan ke daftar mobil aktif showroom.
                </>
            }
            confirmText="Pulihkan Unit"
            confirmIcon={ArrowCounterClockwiseIcon}
            formProps={
                car ? CarController.restore.form(car.id) : undefined
            }
        />
    );
}

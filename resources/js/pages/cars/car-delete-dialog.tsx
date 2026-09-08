import { ArchiveBoxIcon, TrashIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import CarController from '@/actions/App/Http/Controllers/CarController';
import { ConfirmDialog } from '@/components/confirm-dialog';
import type { Car } from '@/pages/cars/types';

type Props = {
    car: Car | null;
    onOpenChange: (open: boolean) => void;
};

export function CarDeleteDialog({ car, onOpenChange }: Props) {
    const [prevCar, setPrevCar] = useState<Car | null>(car);
    const [cachedCar, setCachedCar] = useState<Car | null>(car);

    if (car !== prevCar) {
        setPrevCar(car);

        if (car !== null) {
            setCachedCar(car);
        }
    }

    const activeCar = car ?? cachedCar;
    const isArchived = Boolean(activeCar?.deleted_at);
    const salesCount = activeCar?.sales_count ?? 0;
    const documentProcessesCount = activeCar?.document_processes_count ?? 0;
    const hasRelations = salesCount > 0 || documentProcessesCount > 0;

    const relationDescriptions: string[] = [];

    if (salesCount > 0) {
        relationDescriptions.push(`${salesCount} riwayat transaksi penjualan`);
    }

    if (documentProcessesCount > 0) {
        relationDescriptions.push(
            `${documentProcessesCount} riwayat pengurusan berkas`,
        );
    }

    if (isArchived) {
        if (hasRelations) {
            return (
                <ConfirmDialog
                    open={car !== null}
                    onOpenChange={onOpenChange}
                    tone="warning"
                    title="Tindakan Ditolak"
                    description={
                        <>
                            Unit <strong>{activeCar?.name}</strong>{' '}
                            {activeCar?.license_plate &&
                                `(${activeCar.license_plate})`}{' '}
                            telah memiliki{' '}
                            <strong>
                                {relationDescriptions.join(' dan ')}
                            </strong>{' '}
                            yang tercatat dalam sistem. Data mobil yang memiliki
                            riwayat transaksi atau pengurusan berkas tidak dapat
                            dihapus secara permanen demi menjaga keakuratan
                            audit dan pembukuan. Data unit ini tetap tersimpan
                            aman di arsip.
                        </>
                    }
                    confirmText={null}
                    cancelText="Mengerti"
                />
            );
        }

        return (
            <ConfirmDialog
                open={car !== null}
                onOpenChange={onOpenChange}
                tone="danger"
                title="Hapus Mobil Secara Permanen?"
                description={
                    <>
                        Apakah Anda yakin ingin menghapus data mobil{' '}
                        <strong>{activeCar?.name}</strong>{' '}
                        {activeCar?.license_plate &&
                            `(${activeCar.license_plate})`}{' '}
                        secara permanen?
                        <br />
                        <br />
                        <span className="text-muted-foreground">
                            <strong>Peringatan:</strong> Tindakan ini bersifat
                            permanen dan tidak dapat dibatalkan. Seluruh data
                            modal awal pembelian, catatan dokumen fisik, dan
                            lampiran berkas unit ini akan dihapus selamanya dari
                            sistem.
                        </span>
                    </>
                }
                confirmText="Hapus Permanen"
                confirmIcon={TrashIcon}
                cancelText="Batal"
                formProps={
                    activeCar
                        ? CarController.forceDelete.form(activeCar.id)
                        : undefined
                }
            />
        );
    }

    return (
        <ConfirmDialog
            open={car !== null}
            onOpenChange={onOpenChange}
            tone="danger"
            title="Arsipkan data mobil?"
            description={
                <>
                    Unit <strong>{activeCar?.name}</strong>{' '}
                    {activeCar?.license_plate && `(${activeCar.license_plate})`}{' '}
                    akan disembunyikan dari daftar mobil aktif. Riwayat
                    penjualan, pembayaran, modal, dan dokumen kendaraan tetap
                    tersimpan sehingga data dapat dipulihkan sewaktu-waktu.
                </>
            }
            confirmText="Arsipkan"
            confirmIcon={ArchiveBoxIcon}
            cancelText="Batal"
            formProps={
                activeCar ? CarController.destroy.form(activeCar.id) : undefined
            }
        />
    );
}

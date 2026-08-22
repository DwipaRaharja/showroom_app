import { Form } from '@inertiajs/react';
import { ArchiveBoxIcon, WarningIcon } from '@phosphor-icons/react';
import CarController from '@/actions/App/Http/Controllers/CarController';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import type { Car } from '@/pages/cars/types';

type Props = {
    car: Car | null;
    onOpenChange: (open: boolean) => void;
};

export function CarDeleteDialog({ car, onOpenChange }: Props) {
    return (
        <Dialog open={car !== null} onOpenChange={(open) => onOpenChange(open)}>
            <DialogContent>
                <DialogHeader>
                    <div className="mb-1 flex size-10 items-center justify-center rounded-full bg-red-500/10 text-red-500">
                        <WarningIcon className="size-5" weight="fill" />
                    </div>
                    <DialogTitle>Arsipkan data mobil?</DialogTitle>
                    <DialogDescription>
                        Unit <strong>{car?.name}</strong>{' '}
                        {car?.license_plate && `(${car.license_plate})`} akan
                        disembunyikan dari daftar mobil aktif. Riwayat
                        penjualan, pembayaran, modal, dan dokumen kendaraan
                        tetap tersimpan sehingga data dapat dipulihkan.
                    </DialogDescription>
                </DialogHeader>

                {car && (
                    <Form
                        {...CarController.destroy.form(car.id)}
                        options={{ preserveScroll: true }}
                        onSuccess={() => onOpenChange(false)}
                    >
                        {({ processing }) => (
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        disabled={processing}
                                    >
                                        Batal
                                    </Button>
                                </DialogClose>
                                <Button
                                    type="submit"
                                    variant="destructive"
                                    className="bg-red-500 hover:bg-red-500/90 focus-visible:ring-red-500/20 dark:bg-red-500 dark:hover:bg-red-500/90 dark:focus-visible:ring-red-500/40"
                                    disabled={processing}
                                >
                                    {processing ? (
                                        <Spinner />
                                    ) : (
                                        <ArchiveBoxIcon />
                                    )}
                                    Arsipkan
                                </Button>
                            </DialogFooter>
                        )}
                    </Form>
                )}
            </DialogContent>
        </Dialog>
    );
}

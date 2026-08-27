import { Form } from '@inertiajs/react';
import { ArrowCounterClockwiseIcon } from '@phosphor-icons/react';
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

export function CarRestoreDialog({ car, onOpenChange }: Props) {
    return (
        <Dialog open={car !== null} onOpenChange={(open) => onOpenChange(open)}>
            <DialogContent>
                <DialogHeader>
                    <div className="mb-1 flex size-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        <ArrowCounterClockwiseIcon
                            className="size-5"
                            weight="bold"
                        />
                    </div>
                    <DialogTitle>Pulihkan data mobil?</DialogTitle>
                    <DialogDescription>
                        Unit <strong>{car?.name}</strong>{' '}
                        {car?.license_plate && `(${car.license_plate})`} akan
                        dikembalikan ke daftar mobil aktif showroom.
                    </DialogDescription>
                </DialogHeader>

                {car && (
                    <Form
                        {...CarController.restore.form(car.id)}
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
                                    className="bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:text-white dark:hover:bg-emerald-700"
                                    disabled={processing}
                                >
                                    {processing ? (
                                        <Spinner />
                                    ) : (
                                        <ArrowCounterClockwiseIcon />
                                    )}
                                    Pulihkan Unit
                                </Button>
                            </DialogFooter>
                        )}
                    </Form>
                )}
            </DialogContent>
        </Dialog>
    );
}

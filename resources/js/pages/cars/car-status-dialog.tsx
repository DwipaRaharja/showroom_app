import { Form } from '@inertiajs/react';
import {
    CheckCircleIcon,
    FloppyDiskIcon,
    InfoIcon,
    WrenchIcon,
} from '@phosphor-icons/react';
import { useState } from 'react';
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

const manualStatusOptions: {
    value: 'available' | 'maintenance';
    label: string;
    description: string;
    icon: typeof CheckCircleIcon;
    colorClass: string;
}[] = [
    {
        value: 'available',
        label: 'Tersedia',
        description: 'Mobil siap untuk dipajang dan dijual di showroom.',
        icon: CheckCircleIcon,
        colorClass: 'text-emerald-600 dark:text-emerald-500',
    },
    {
        value: 'maintenance',
        label: 'Perbaikan / Servis',
        description: 'Mobil sedang dalam perbaikan, detailing, atau servis.',
        icon: WrenchIcon,
        colorClass: 'text-rose-600 dark:text-rose-500',
    },
];

function CarStatusContent({
    car,
    onOpenChange,
}: {
    car: Car;
    onOpenChange: (open: boolean) => void;
}) {
    const isSaleManaged = car.status === 'booked' || car.status === 'sold';
    const initialStatus =
        car.status === 'maintenance' ? 'maintenance' : 'available';
    const [status, setStatus] = useState<'available' | 'maintenance'>(
        initialStatus,
    );

    return (
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Ubah Status Operasional Mobil</DialogTitle>
                <DialogDescription>
                    Pilih status operasional untuk <strong>{car.name}</strong> (
                    {car.license_plate ?? 'Tanpa Plat'}).
                </DialogDescription>
            </DialogHeader>

            {isSaleManaged ? (
                <div className="space-y-4">
                    <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
                        <InfoIcon
                            className="mt-0.5 size-5 shrink-0"
                            weight="fill"
                        />
                        <div className="text-sm">
                            <p className="font-semibold">
                                Status Dikelola Transaksi Penjualan
                            </p>
                            <p className="mt-1 text-xs leading-relaxed opacity-90">
                                Mobil ini saat ini berstatus{' '}
                                <strong>
                                    {car.status === 'booked'
                                        ? 'Dibooking'
                                        : 'Terjual'}
                                </strong>
                                . Perubahan status dilakukan secara otomatis
                                melalui alur transaksi penjualan dan penerimaan
                                pembayaran.
                            </p>
                        </div>
                    </div>

                    <DialogFooter className="pt-2">
                        <DialogClose asChild>
                            <Button type="button" variant="outline">
                                Tutup
                            </Button>
                        </DialogClose>
                    </DialogFooter>
                </div>
            ) : (
                <Form
                    {...CarController.updateStatus.form(car.id)}
                    options={{ preserveScroll: true }}
                    onSuccess={() => onOpenChange(false)}
                    className="space-y-4"
                >
                    {({ processing }) => (
                        <>
                            <input type="hidden" name="status" value={status} />

                            <div className="space-y-2">
                                {manualStatusOptions.map((option) => {
                                    const Icon = option.icon;
                                    const isSelected = status === option.value;

                                    return (
                                        <div
                                            key={option.value}
                                            onClick={() =>
                                                setStatus(option.value)
                                            }
                                            className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                                                isSelected
                                                    ? 'border-primary bg-primary/5 dark:bg-primary/10'
                                                    : 'hover:bg-muted/50'
                                            }`}
                                        >
                                            <div
                                                className={`mt-0.5 ${option.colorClass}`}
                                            >
                                                <Icon
                                                    className="size-5"
                                                    weight={
                                                        isSelected
                                                            ? 'fill'
                                                            : 'regular'
                                                    }
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-sm font-medium">
                                                    {option.label}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {option.description}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <DialogFooter className="pt-2">
                                <DialogClose asChild>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        disabled={processing}
                                    >
                                        Batal
                                    </Button>
                                </DialogClose>
                                <Button type="submit" disabled={processing}>
                                    {processing ? (
                                        <Spinner />
                                    ) : (
                                        <FloppyDiskIcon />
                                    )}
                                    Simpan status
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            )}
        </DialogContent>
    );
}

export function CarStatusDialog({ car, onOpenChange }: Props) {
    return (
        <Dialog open={car !== null} onOpenChange={onOpenChange}>
            {car && <CarStatusContent car={car} onOpenChange={onOpenChange} />}
        </Dialog>
    );
}

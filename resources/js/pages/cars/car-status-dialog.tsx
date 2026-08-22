import { Form } from '@inertiajs/react';
import {
    CheckCircleIcon,
    ClockIcon,
    FloppyDiskIcon,
    TagIcon,
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
import type { Car, CarStatus } from '@/pages/cars/types';

type Props = {
    car: Car | null;
    onOpenChange: (open: boolean) => void;
};

const statusOptions: {
    value: CarStatus;
    label: string;
    description: string;
    icon: typeof CheckCircleIcon;
    colorClass: string;
}[] = [
    {
        value: 'available',
        label: 'Tersedia',
        description: 'Mobil siap untuk dijual atau dipajang di showroom.',
        icon: CheckCircleIcon,
        colorClass: 'text-emerald-600 dark:text-emerald-500',
    },
    {
        value: 'booked',
        label: 'Dibooking',
        description: 'Mobil telah dibooking oleh calon customer.',
        icon: ClockIcon,
        colorClass: 'text-amber-600 dark:text-amber-500',
    },
    {
        value: 'sold',
        label: 'Terjual',
        description: 'Mobil telah berhasil terjual ke customer.',
        icon: TagIcon,
        colorClass: 'text-blue-600 dark:text-blue-500',
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
    const [status, setStatus] = useState<CarStatus>(car.status);

    return (
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Ubah Status Mobil</DialogTitle>
                <DialogDescription>
                    Pilih status terbaru untuk <strong>{car.name}</strong> (
                    {car.license_plate ?? 'Tanpa Plat'}).
                </DialogDescription>
            </DialogHeader>

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
                            {statusOptions.map((option) => {
                                const Icon = option.icon;
                                const isSelected = status === option.value;

                                return (
                                    <div
                                        key={option.value}
                                        onClick={() => setStatus(option.value)}
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
                                {processing ? <Spinner /> : <FloppyDiskIcon />}
                                Simpan status
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </Form>
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

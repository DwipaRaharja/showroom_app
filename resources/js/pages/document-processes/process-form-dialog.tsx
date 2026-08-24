import { Form } from '@inertiajs/react';
import { FloppyDiskIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import DocumentProcessController from '@/actions/App/Http/Controllers/DocumentProcessController';
import InputError from '@/components/input-error';
import { PriceInput } from '@/components/price-input';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import type {
    DocumentProcessType,
    LabelOptions,
    ProcessCar,
    UserOption,
} from '@/pages/document-processes/types';

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    cars: ProcessCar[];
    users: UserOption[];
    typeOptions: LabelOptions;
    costTypeOptions: LabelOptions;
    initialCarId?: number | null;
};

function today(): string {
    const date = new Date();
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);

    return local.toISOString().slice(0, 10);
}

export function ProcessFormDialog({
    open,
    onOpenChange,
    cars,
    users,
    typeOptions,
    costTypeOptions,
    initialCarId = null,
}: Props) {
    const [carId, setCarId] = useState(
        initialCarId === null ? '' : String(initialCarId),
    );
    const [processType, setProcessType] =
        useState<DocumentProcessType>('annual_tax');
    const [assignedTo, setAssignedTo] = useState('none');
    const [initialCost, setInitialCost] = useState('');
    const [initialCostType, setInitialCostType] = useState('administration');
    const [paidBy, setPaidBy] = useState('showroom');

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Tambah Proses Berkas</DialogTitle>
                    <DialogDescription>
                        Buat pekerjaan pengurusan baru untuk satu kendaraan.
                    </DialogDescription>
                </DialogHeader>

                <Form
                    action={DocumentProcessController.store.url()}
                    method="post"
                    onSuccess={() => onOpenChange(false)}
                    className="grid gap-5"
                >
                    {({ processing, errors }) => (
                        <>
                            <input type="hidden" name="car_id" value={carId} />
                            <input
                                type="hidden"
                                name="process_type"
                                value={processType}
                            />
                            <input
                                type="hidden"
                                name="assigned_to"
                                value={assignedTo === 'none' ? '' : assignedTo}
                            />
                            <input
                                type="hidden"
                                name="initial_cost_type"
                                value={initialCostType}
                            />
                            <input
                                type="hidden"
                                name="initial_cost_paid_by"
                                value={paidBy}
                            />

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="grid gap-1.5 sm:col-span-2">
                                    <Label>Kendaraan *</Label>
                                    <Select
                                        value={carId}
                                        onValueChange={setCarId}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih kendaraan" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {cars.map((car) => (
                                                <SelectItem
                                                    key={car.id}
                                                    value={String(car.id)}
                                                >
                                                    {car.brand?.name} {car.name}{' '}
                                                    ·{' '}
                                                    {car.license_plate ??
                                                        'Tanpa plat'}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.car_id} />
                                </div>

                                <div className="grid gap-1.5 sm:col-span-2">
                                    <Label>Jenis proses *</Label>
                                    <Select
                                        value={processType}
                                        onValueChange={(value) =>
                                            setProcessType(
                                                value as DocumentProcessType,
                                            )
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(typeOptions).map(
                                                ([value, label]) => (
                                                    <SelectItem
                                                        key={value}
                                                        value={value}
                                                    >
                                                        {label}
                                                    </SelectItem>
                                                ),
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.process_type} />
                                </div>

                                <div className="grid gap-1.5">
                                    <Label htmlFor="process-started-at">
                                        Tanggal mulai *
                                    </Label>
                                    <Input
                                        id="process-started-at"
                                        name="started_at"
                                        type="date"
                                        defaultValue={today()}
                                    />
                                    <InputError message={errors.started_at} />
                                </div>
                                <div className="grid gap-1.5">
                                    <Label htmlFor="process-estimated-at">
                                        Target selesai
                                    </Label>
                                    <Input
                                        id="process-estimated-at"
                                        name="estimated_completion_date"
                                        type="date"
                                    />
                                    <InputError
                                        message={
                                            errors.estimated_completion_date
                                        }
                                    />
                                </div>

                                <div className="grid gap-1.5 sm:col-span-2">
                                    <Label>Penanggung jawab</Label>
                                    <Select
                                        value={assignedTo}
                                        onValueChange={setAssignedTo}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">
                                                Belum ditentukan
                                            </SelectItem>
                                            {users.map((user) => (
                                                <SelectItem
                                                    key={user.id}
                                                    value={String(user.id)}
                                                >
                                                    {user.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid gap-1.5">
                                    <Label htmlFor="processor-name">
                                        Biro jasa / petugas luar
                                    </Label>
                                    <Input
                                        id="processor-name"
                                        name="processor_name"
                                    />
                                </div>
                                <div className="grid gap-1.5">
                                    <Label htmlFor="processor-phone">
                                        Nomor kontak
                                    </Label>
                                    <Input
                                        id="processor-phone"
                                        name="processor_phone"
                                    />
                                </div>

                                {processType === 'name_transfer' && (
                                    <div className="grid gap-1.5 sm:col-span-2">
                                        <Label htmlFor="target-owner">
                                            Nama pemilik baru *
                                        </Label>
                                        <Input
                                            id="target-owner"
                                            name="target_owner_name"
                                        />
                                        <InputError
                                            message={errors.target_owner_name}
                                        />
                                    </div>
                                )}

                                {processType === 'mutation' && (
                                    <>
                                        <div className="grid gap-1.5">
                                            <Label htmlFor="origin-region">
                                                Daerah asal *
                                            </Label>
                                            <Input
                                                id="origin-region"
                                                name="origin_region"
                                            />
                                        </div>
                                        <div className="grid gap-1.5">
                                            <Label htmlFor="destination-region">
                                                Daerah tujuan *
                                            </Label>
                                            <Input
                                                id="destination-region"
                                                name="destination_region"
                                            />
                                            <InputError
                                                message={
                                                    errors.destination_region
                                                }
                                            />
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2">
                                <div className="sm:col-span-2">
                                    <h3 className="font-semibold">
                                        Biaya awal (opsional)
                                    </h3>
                                    <p className="text-xs text-muted-foreground">
                                        Biaya showroom otomatis menambah modal
                                        kendaraan.
                                    </p>
                                </div>
                                <div className="grid gap-1.5">
                                    <Label>Jenis biaya</Label>
                                    <Select
                                        value={initialCostType}
                                        onValueChange={setInitialCostType}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(
                                                costTypeOptions,
                                            ).map(([value, label]) => (
                                                <SelectItem
                                                    key={value}
                                                    value={value}
                                                >
                                                    {label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-1.5">
                                    <Label>Dibayar oleh</Label>
                                    <Select
                                        value={paidBy}
                                        onValueChange={setPaidBy}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="showroom">
                                                Showroom (masuk modal)
                                            </SelectItem>
                                            <SelectItem value="customer">
                                                Customer
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-1.5 sm:col-span-2">
                                    <Label>Jumlah biaya</Label>
                                    <PriceInput
                                        name="initial_cost"
                                        value={initialCost}
                                        onValueChange={setInitialCost}
                                    />
                                    <InputError message={errors.initial_cost} />
                                </div>
                            </div>

                            <div className="grid gap-1.5">
                                <Label htmlFor="process-notes">Catatan</Label>
                                <Textarea
                                    id="process-notes"
                                    name="notes"
                                    rows={3}
                                />
                            </div>

                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button type="button" variant="outline">
                                        Batal
                                    </Button>
                                </DialogClose>
                                <Button
                                    type="submit"
                                    disabled={processing || carId === ''}
                                >
                                    {processing ? (
                                        <Spinner />
                                    ) : (
                                        <FloppyDiskIcon />
                                    )}
                                    Simpan proses
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}

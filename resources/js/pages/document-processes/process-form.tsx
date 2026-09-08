import { Form, Link } from '@inertiajs/react';
import { FloppyDiskIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import DocumentProcessController from '@/actions/App/Http/Controllers/DocumentProcessController';
import { CarPicker } from '@/components/car-picker';
import InputError from '@/components/input-error';
import { PriceInput } from '@/components/price-input';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
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
    cars: ProcessCar[];
    users: UserOption[];
    typeOptions: LabelOptions;
    initialCarId?: number | null;
};

const validationColorClassName =
    'aria-invalid:border-red-500 aria-invalid:ring-red-500/20 dark:aria-invalid:ring-red-500/40';
const errorTextClassName = 'text-red-500 dark:text-red-500';

function today(): string {
    const date = new Date();
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);

    return local.toISOString().slice(0, 10);
}

export function ProcessForm({
    cars,
    users,
    typeOptions,
    initialCarId = null,
}: Props) {
    const [carId, setCarId] = useState(
        initialCarId === null ? '' : String(initialCarId),
    );
    const [processType, setProcessType] =
        useState<DocumentProcessType>('annual_tax');
    const [assignedTo, setAssignedTo] = useState('none');
    const [initialCost, setInitialCost] = useState('');
    const [paidBy, setPaidBy] = useState('showroom');

    return (
        <Form
            action={DocumentProcessController.store.url()}
            method="post"
            options={{ preserveScroll: true }}
            className="space-y-6"
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
                        name="initial_cost_paid_by"
                        value={paidBy}
                    />

                    {/* Card 1: Kendaraan & Jenis Pengurusan */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Kendaraan & jenis pengurusan</CardTitle>
                            <CardDescription>
                                Pilih unit mobil target dan jenis pengurusan
                                berkas yang akan diproses.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-5 sm:grid-cols-2">
                            <CarPicker
                                cars={cars}
                                value={carId}
                                onSelect={(car) =>
                                    setCarId(car ? String(car.id) : '')
                                }
                                error={errors.car_id}
                                activeProcessId={
                                    errors.car_id_active_process_id
                                }
                                required
                                label="Kendaraan"
                                showSelectedHelper
                                className="sm:col-span-2"
                            />

                            <div className="grid gap-2 sm:col-span-2">
                                <Label>
                                    Jenis proses{' '}
                                    <span className="text-red-500">*</span>
                                </Label>
                                <Select
                                    value={processType}
                                    onValueChange={(value) =>
                                        setProcessType(
                                            value as DocumentProcessType,
                                        )
                                    }
                                >
                                    <SelectTrigger
                                        aria-invalid={Boolean(
                                            errors.process_type,
                                        )}
                                        className={validationColorClassName}
                                    >
                                        <SelectValue placeholder="Pilih jenis proses" />
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
                                <InputError
                                    message={errors.process_type}
                                    className={errorTextClassName}
                                />
                            </div>

                            {processType === 'name_transfer' && (
                                <div className="grid gap-2 sm:col-span-2">
                                    <Label htmlFor="target-owner">
                                        Nama pemilik baru
                                    </Label>
                                    <Input
                                        id="target-owner"
                                        name="target_owner_name"
                                        placeholder="Contoh: Muhammad Ramadhan"
                                        aria-invalid={Boolean(
                                            errors.target_owner_name,
                                        )}
                                        className={validationColorClassName}
                                    />
                                    <InputError
                                        message={errors.target_owner_name}
                                        className={errorTextClassName}
                                    />
                                </div>
                            )}

                            {processType === 'mutation' && (
                                <>
                                    <div className="grid gap-2">
                                        <Label htmlFor="origin-region">
                                            Daerah asal
                                        </Label>
                                        <Input
                                            id="origin-region"
                                            name="origin_region"
                                            placeholder="Contoh: Makassar"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="destination-region">
                                            Daerah tujuan
                                        </Label>
                                        <Input
                                            id="destination-region"
                                            name="destination_region"
                                            placeholder="Contoh: Gowa"
                                            aria-invalid={Boolean(
                                                errors.destination_region,
                                            )}
                                            className={validationColorClassName}
                                        />
                                        <InputError
                                            message={errors.destination_region}
                                            className={errorTextClassName}
                                        />
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Card 2: Jadwal & Pelaksana */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Jadwal & pelaksana</CardTitle>
                            <CardDescription>
                                Atur tanggal mulai, estimasi tanggal selesai,
                                serta pihak pelaksana proses.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-5 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="process-started-at">
                                    Tanggal mulai{' '}
                                    <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="process-started-at"
                                    name="started_at"
                                    type="date"
                                    defaultValue={today()}
                                    aria-invalid={Boolean(errors.started_at)}
                                    className={validationColorClassName}
                                />
                                <InputError
                                    message={errors.started_at}
                                    className={errorTextClassName}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="process-estimated-at">
                                    Estimasi tanggal selesai
                                </Label>
                                <Input
                                    id="process-estimated-at"
                                    name="estimated_completion_date"
                                    type="date"
                                    aria-invalid={Boolean(
                                        errors.estimated_completion_date,
                                    )}
                                    className={validationColorClassName}
                                />
                                <InputError
                                    message={errors.estimated_completion_date}
                                    className={errorTextClassName}
                                />
                            </div>

                            <div className="grid gap-2 sm:col-span-2">
                                <Label>
                                    Penanggung jawab (Internal Showroom)
                                </Label>
                                <Select
                                    value={assignedTo}
                                    onValueChange={setAssignedTo}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih penanggung jawab" />
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

                            <div className="grid gap-2">
                                <Label htmlFor="processor-name">
                                    Biro jasa / petugas luar (opsional)
                                </Label>
                                <Input
                                    id="processor-name"
                                    name="processor_name"
                                    placeholder="Contoh: Biro Jasa Andi"
                                    aria-invalid={Boolean(
                                        errors.processor_name,
                                    )}
                                    className={validationColorClassName}
                                />
                                <InputError
                                    message={errors.processor_name}
                                    className={errorTextClassName}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="processor-phone">
                                    Nomor kontak petugas / biro jasa (opsional)
                                </Label>
                                <Input
                                    id="processor-phone"
                                    name="processor_phone"
                                    placeholder="Contoh: 0812 3456 7890"
                                    aria-invalid={Boolean(
                                        errors.processor_phone,
                                    )}
                                    className={validationColorClassName}
                                />
                                <InputError
                                    message={errors.processor_phone}
                                    className={errorTextClassName}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Card 3: Biaya Awal Proses */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Biaya awal proses</CardTitle>
                            <CardDescription>
                                Rincian biaya awal yang dikeluarkan saat
                                pengurusan berkas dimulai.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-5 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label>
                                    Dibayar oleh{' '}
                                    <span className="text-red-500">*</span>
                                </Label>
                                <Select
                                    value={paidBy}
                                    onValueChange={setPaidBy}
                                >
                                    <SelectTrigger
                                        aria-invalid={Boolean(
                                            errors.initial_cost_paid_by,
                                        )}
                                        className={validationColorClassName}
                                    >
                                        <SelectValue placeholder="Pilih pihak pembayar" />
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
                                <InputError
                                    message={errors.initial_cost_paid_by}
                                    className={errorTextClassName}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>
                                    Jumlah biaya{' '}
                                    <span className="text-red-500">*</span>
                                </Label>
                                <PriceInput
                                    name="initial_cost"
                                    value={initialCost}
                                    onValueChange={setInitialCost}
                                    placeholder="Contoh: 1.500.000"
                                    required
                                    aria-invalid={Boolean(errors.initial_cost)}
                                    className={validationColorClassName}
                                />
                                <InputError
                                    message={errors.initial_cost}
                                    className={errorTextClassName}
                                />
                            </div>

                            <div className="rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground sm:col-span-2">
                                <span className="font-semibold text-foreground">
                                    Catatan Biaya:
                                </span>{' '}
                                Biaya yang dibayar showroom otomatis menambah
                                modal kendaraan, sedangkan biaya customer hanya
                                dicatat pada riwayat proses.
                            </div>
                        </CardContent>
                    </Card>

                    {/* Card 4: Catatan Tambahan */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Catatan tambahan</CardTitle>
                            <CardDescription>
                                Keterangan berkas atau instruksi khusus terkait
                                pengurusan.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-5">
                            <div className="grid gap-2">
                                <Label htmlFor="process-notes">
                                    Catatan (opsional)
                                </Label>
                                <Textarea
                                    id="process-notes"
                                    name="notes"
                                    rows={3}
                                    placeholder="Contoh: Dokumen STNK masih menunggu diserahkan oleh pemilik sebelumnya."
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Form Actions Footer */}
                    <div className="flex flex-wrap items-center justify-end gap-3">
                        <Button type="button" variant="outline" asChild>
                            <Link href={DocumentProcessController.index.url()}>
                                Batal
                            </Link>
                        </Button>
                        <Button
                            type="submit"
                            disabled={
                                processing || carId === '' || initialCost === ''
                            }
                        >
                            {processing ? (
                                <Spinner />
                            ) : (
                                <FloppyDiskIcon className="size-4" />
                            )}
                            Simpan proses
                        </Button>
                    </div>
                </>
            )}
        </Form>
    );
}

import { Form } from '@inertiajs/react';
import { FloppyDiskIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import DocumentProcessController from '@/actions/App/Http/Controllers/DocumentProcessController';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
    DocumentProcess,
    DocumentProcessStatus,
    LabelOptions,
} from '@/pages/document-processes/types';

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    process: DocumentProcess;
    statusOptions: LabelOptions;
};

const validationColorClassName =
    'aria-invalid:border-red-500 aria-invalid:ring-red-500/20 dark:aria-invalid:ring-red-500/40';
const errorTextClassName = 'text-red-500 dark:text-red-500';

const eventStatusValues: Record<
    DocumentProcessStatus,
    DocumentProcessStatus[]
> = {
    waiting_documents: [
        'waiting_documents',
        'processing',
        'completed',
        'issue',
    ],
    processing: ['processing', 'completed', 'issue'],
    completed: ['completed', 'issue'],
    issue: ['issue', 'processing', 'completed'],
    cancelled: ['cancelled'],
};

function nowForInput(): string {
    const date = new Date();
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);

    return local.toISOString().slice(0, 16);
}

function ProcessEventForm({
    process,
    statusOptions,
    onSuccess,
}: {
    process: DocumentProcess;
    statusOptions: LabelOptions;
    onSuccess: () => void;
}) {
    const [status, setStatus] = useState<DocumentProcessStatus>(process.status);
    const [receivedItems, setReceivedItems] = useState<number[]>([]);
    const initialPlateParts = (process.car.license_plate ?? '')
        .trim()
        .split(/\s+/);
    const [platePrefix, setPlatePrefix] = useState(initialPlateParts[0] ?? '');
    const [plateNumber, setPlateNumber] = useState(initialPlateParts[1] ?? '');
    const [plateSuffix, setPlateSuffix] = useState(initialPlateParts[2] ?? '');

    const availableItems = process.items.filter((item) =>
        ['waiting', 'missing'].includes(item.custody_status),
    );

    function toggleItem(itemId: number, checked: boolean) {
        setReceivedItems((current) => {
            const next = checked
                ? [...new Set([...current, itemId])]
                : current.filter((id) => id !== itemId);

            // Saat dokumen ditandai diterima, otomatis alihkan status menjadi 'completed' (Proses selesai)
            if (checked) {
                setStatus('completed');
            }

            return next;
        });
    }

    function handleStatusChange(newStatus: DocumentProcessStatus) {
        setStatus(newStatus);

        // Jika user memilih status 'completed' (Proses selesai), otomatis tandai seluruh dokumen yang belum diterima
        if (newStatus === 'completed' && availableItems.length > 0) {
            setReceivedItems(availableItems.map((item) => item.id));
        }
    }

    return (
        <Form
            action={DocumentProcessController.storeEvent.url(process.id)}
            method="post"
            onSuccess={onSuccess}
            className="grid gap-5"
        >
            {({ processing, errors }) => (
                <>
                    <input type="hidden" name="status" value={status} />
                    {receivedItems.map((itemId) => (
                        <input
                            key={itemId}
                            type="hidden"
                            name="received_items[]"
                            value={itemId}
                        />
                    ))}

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-1.5">
                            <Label htmlFor="event-status">
                                Status terbaru{' '}
                                <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={status}
                                onValueChange={(value) =>
                                    handleStatusChange(
                                        value as DocumentProcessStatus,
                                    )
                                }
                            >
                                <SelectTrigger
                                    id="event-status"
                                    aria-invalid={Boolean(errors.status)}
                                    className={validationColorClassName}
                                >
                                    <SelectValue placeholder="Pilih status terbaru" />
                                </SelectTrigger>
                                <SelectContent>
                                    {eventStatusValues[process.status].map(
                                        (value) => (
                                            <SelectItem
                                                key={value}
                                                value={value}
                                            >
                                                {statusOptions[value]}
                                            </SelectItem>
                                        ),
                                    )}
                                </SelectContent>
                            </Select>
                            <InputError
                                message={errors.status}
                                className={errorTextClassName}
                            />
                        </div>

                        <div className="grid gap-1.5">
                            <Label htmlFor="event-occurred-at">
                                Tanggal dan waktu kejadian{' '}
                                <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="event-occurred-at"
                                name="occurred_at"
                                type="datetime-local"
                                max={nowForInput()}
                                defaultValue={nowForInput()}
                                required
                                aria-invalid={Boolean(errors.occurred_at)}
                                className={validationColorClassName}
                            />
                            <InputError
                                message={errors.occurred_at}
                                className={errorTextClassName}
                            />
                        </div>

                        <div className="grid gap-1.5 sm:col-span-2">
                            <Label htmlFor="event-description">
                                Keterangan kejadian{' '}
                                <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="event-description"
                                name="description"
                                placeholder="Contoh: Berkas sudah diajukan ke Samsat"
                                required
                                aria-invalid={Boolean(errors.description)}
                                className={validationColorClassName}
                            />
                            <InputError
                                message={errors.description}
                                className={errorTextClassName}
                            />
                        </div>

                        <div className="grid gap-1.5 sm:col-span-2">
                            <Label htmlFor="event-location">Lokasi</Label>
                            <Input
                                id="event-location"
                                name="location"
                                placeholder="Contoh: Samsat Makassar"
                                aria-invalid={Boolean(errors.location)}
                                className={validationColorClassName}
                            />
                            <InputError
                                message={errors.location}
                                className={errorTextClassName}
                            />
                        </div>
                    </div>

                    {availableItems.length > 0 && (
                        <div
                            aria-invalid={Boolean(errors.received_items)}
                            className={`grid gap-3 rounded-xl border p-4 ${validationColorClassName}`}
                        >
                            <div>
                                <h3 className="font-semibold">
                                    Dokumen yang diterima
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                    Tandai dokumen fisik yang baru diterima pada
                                    kejadian ini.
                                </p>
                            </div>
                            <div className="grid gap-2 sm:grid-cols-2">
                                {availableItems.map((item) => (
                                    <label
                                        key={item.id}
                                        className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm"
                                    >
                                        <Checkbox
                                            checked={receivedItems.includes(
                                                item.id,
                                            )}
                                            onCheckedChange={(value) =>
                                                toggleItem(
                                                    item.id,
                                                    value === true,
                                                )
                                            }
                                        />
                                        {item.item_name}
                                    </label>
                                ))}
                            </div>
                            <InputError
                                message={errors.received_items}
                                className={errorTextClassName}
                            />
                        </div>
                    )}

                    {status === 'completed' && (
                        <div className="grid gap-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                                <h3 className="font-semibold">Hasil proses</h3>
                                <p className="text-xs text-muted-foreground">
                                    Hasil ini akan memperbarui data kendaraan
                                    dan STNK.
                                </p>
                            </div>

                            {process.process_type === 'annual_tax' && (
                                <div className="grid gap-1.5 sm:col-span-2">
                                    <Label htmlFor="annual-tax-due">
                                        Jatuh tempo pajak tahunan baru{' '}
                                        <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="annual-tax-due"
                                        name="result[annual_tax_due_at]"
                                        type="date"
                                        required
                                        aria-invalid={Boolean(
                                            errors['result.annual_tax_due_at'],
                                        )}
                                        className={validationColorClassName}
                                    />
                                    <InputError
                                        message={
                                            errors['result.annual_tax_due_at']
                                        }
                                        className={errorTextClassName}
                                    />
                                </div>
                            )}

                            {process.process_type === 'five_year_tax' && (
                                <div className="grid gap-1.5 sm:col-span-2">
                                    <Label htmlFor="stnk-expires-at">
                                        Masa berlaku STNK/plat baru{' '}
                                        <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="stnk-expires-at"
                                        name="result[stnk_expires_at]"
                                        type="date"
                                        required
                                        aria-invalid={Boolean(
                                            errors['result.stnk_expires_at'],
                                        )}
                                        className={validationColorClassName}
                                    />
                                    <InputError
                                        message={
                                            errors['result.stnk_expires_at']
                                        }
                                        className={errorTextClassName}
                                    />
                                </div>
                            )}

                            {['name_transfer', 'mutation'].includes(
                                process.process_type,
                            ) && (
                                <>
                                    <div className="grid gap-1.5 sm:col-span-2">
                                        <Label htmlFor="result-owner">
                                            Nama pemilik pada dokumen
                                        </Label>
                                        <Input
                                            id="result-owner"
                                            name="result[owner_name]"
                                            placeholder="Contoh: Muhammad Ramadhan"
                                            defaultValue={
                                                process.target_owner_name ?? ''
                                            }
                                            aria-invalid={Boolean(
                                                errors['result.owner_name'],
                                            )}
                                            className={validationColorClassName}
                                        />
                                        <InputError
                                            message={
                                                errors['result.owner_name']
                                            }
                                            className={errorTextClassName}
                                        />
                                    </div>

                                    <div className="grid gap-1.5 sm:col-span-2">
                                        <Label>Nomor polisi / plat baru</Label>
                                        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                                            <div className="space-y-1">
                                                <Input
                                                    id="result-plate-prefix"
                                                    name="result[plate_prefix]"
                                                    value={platePrefix}
                                                    onChange={(event) =>
                                                        setPlatePrefix(
                                                            event.target.value
                                                                .replace(
                                                                    /[^a-zA-Z]/g,
                                                                    '',
                                                                )
                                                                .toUpperCase(),
                                                        )
                                                    }
                                                    placeholder="B / KT"
                                                    maxLength={2}
                                                    className={`text-center font-mono font-bold tracking-wider ${validationColorClassName}`}
                                                    aria-invalid={Boolean(
                                                        errors[
                                                            'result.license_plate'
                                                        ],
                                                    )}
                                                />
                                                <span className="block text-center text-[11px] text-muted-foreground">
                                                    Wilayah (KT)
                                                </span>
                                            </div>

                                            <div className="space-y-1 sm:col-span-2">
                                                <Input
                                                    id="result-plate-number"
                                                    name="result[plate_number]"
                                                    value={plateNumber}
                                                    onChange={(event) =>
                                                        setPlateNumber(
                                                            event.target.value.replace(
                                                                /[^0-9]/g,
                                                                '',
                                                            ),
                                                        )
                                                    }
                                                    placeholder="1234"
                                                    maxLength={4}
                                                    inputMode="numeric"
                                                    className={`text-center font-mono font-bold tracking-wider ${validationColorClassName}`}
                                                    aria-invalid={Boolean(
                                                        errors[
                                                            'result.license_plate'
                                                        ],
                                                    )}
                                                />
                                                <span className="block text-center text-[11px] text-muted-foreground">
                                                    Nomor Polisi (Angka)
                                                </span>
                                            </div>

                                            <div className="space-y-1">
                                                <Input
                                                    id="result-plate-suffix"
                                                    name="result[plate_suffix]"
                                                    value={plateSuffix}
                                                    onChange={(event) =>
                                                        setPlateSuffix(
                                                            event.target.value
                                                                .replace(
                                                                    /[^a-zA-Z]/g,
                                                                    '',
                                                                )
                                                                .toUpperCase(),
                                                        )
                                                    }
                                                    placeholder="ABC"
                                                    maxLength={3}
                                                    className={`text-center font-mono font-bold tracking-wider ${validationColorClassName}`}
                                                    aria-invalid={Boolean(
                                                        errors[
                                                            'result.license_plate'
                                                        ],
                                                    )}
                                                />
                                                <span className="block text-center text-[11px] text-muted-foreground">
                                                    Seri (ABC)
                                                </span>
                                            </div>
                                        </div>
                                        <InputError
                                            message={
                                                errors['result.license_plate']
                                            }
                                            className={errorTextClassName}
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-1.5 sm:col-span-2">
                            <Label htmlFor="event-files">Bukti kejadian</Label>
                            <Input
                                id="event-files"
                                name="files[]"
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png,.webp"
                                multiple
                                aria-invalid={Boolean(errors.files)}
                                className={validationColorClassName}
                            />
                            <p className="text-xs text-muted-foreground">
                                Maksimal 5 file, masing-masing 5 MB.
                            </p>
                            <InputError
                                message={errors.files}
                                className={errorTextClassName}
                            />
                        </div>
                        <div className="grid gap-1.5 sm:col-span-2">
                            <Label htmlFor="event-notes">Catatan</Label>
                            <Textarea
                                id="event-notes"
                                name="notes"
                                rows={3}
                                placeholder="Contoh: Berkas diterima lengkap dan tanpa kerusakan."
                                aria-invalid={Boolean(errors.notes)}
                                className={validationColorClassName}
                            />
                            <InputError
                                message={errors.notes}
                                className={errorTextClassName}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="outline">
                                Batal
                            </Button>
                        </DialogClose>
                        <Button type="submit" disabled={processing}>
                            {processing ? <Spinner /> : <FloppyDiskIcon />}
                            Simpan perkembangan
                        </Button>
                    </DialogFooter>
                </>
            )}
        </Form>
    );
}

export function ProcessEventDialog({
    open,
    onOpenChange,
    process,
    statusOptions,
}: Props) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Catat Perkembangan Proses</DialogTitle>
                    <DialogDescription>
                        Tambahkan satu kejadian baru ke timeline{' '}
                        {process.process_number}.
                    </DialogDescription>
                </DialogHeader>

                {open && (
                    <ProcessEventForm
                        key={`${process.id}-${open}`}
                        process={process}
                        statusOptions={statusOptions}
                        onSuccess={() => onOpenChange(false)}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
}

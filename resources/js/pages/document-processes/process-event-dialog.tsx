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

function nowForInput(): string {
    const date = new Date();
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);

    return local.toISOString().slice(0, 16);
}

export function ProcessEventDialog({
    open,
    onOpenChange,
    process,
    statusOptions,
}: Props) {
    const [status, setStatus] = useState<DocumentProcessStatus>(process.status);
    const [receivedItems, setReceivedItems] = useState<number[]>([]);
    const availableItems = process.items.filter((item) =>
        ['waiting', 'missing'].includes(item.custody_status),
    );

    function toggleItem(itemId: number, checked: boolean) {
        setReceivedItems((current) =>
            checked
                ? [...new Set([...current, itemId])]
                : current.filter((id) => id !== itemId),
        );
    }

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

                <Form
                    action={DocumentProcessController.storeEvent.url(
                        process.id,
                    )}
                    method="post"
                    onSuccess={() => onOpenChange(false)}
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
                                    <Label>Status terbaru *</Label>
                                    <Select
                                        value={status}
                                        onValueChange={(value) =>
                                            setStatus(
                                                value as DocumentProcessStatus,
                                            )
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(statusOptions).map(
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
                                    <InputError message={errors.status} />
                                </div>

                                <div className="grid gap-1.5">
                                    <Label htmlFor="event-occurred-at">
                                        Tanggal dan waktu kejadian *
                                    </Label>
                                    <Input
                                        id="event-occurred-at"
                                        name="occurred_at"
                                        type="datetime-local"
                                        max={nowForInput()}
                                        defaultValue={nowForInput()}
                                    />
                                    <InputError message={errors.occurred_at} />
                                </div>

                                <div className="grid gap-1.5 sm:col-span-2">
                                    <Label htmlFor="event-description">
                                        Keterangan kejadian *
                                    </Label>
                                    <Input
                                        id="event-description"
                                        name="description"
                                        placeholder="Contoh: Berkas sudah diajukan ke Samsat"
                                    />
                                    <InputError message={errors.description} />
                                </div>

                                <div className="grid gap-1.5 sm:col-span-2">
                                    <Label htmlFor="event-location">
                                        Lokasi
                                    </Label>
                                    <Input
                                        id="event-location"
                                        name="location"
                                        placeholder="Contoh: Samsat Makassar"
                                    />
                                </div>
                            </div>

                            {availableItems.length > 0 && (
                                <div className="grid gap-3 rounded-xl border p-4">
                                    <div>
                                        <h3 className="font-semibold">
                                            Dokumen yang diterima
                                        </h3>
                                        <p className="text-xs text-muted-foreground">
                                            Tandai dokumen fisik yang baru
                                            diterima pada kejadian ini.
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
                                </div>
                            )}

                            {status === 'completed' && (
                                <div className="grid gap-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 sm:grid-cols-2">
                                    <div className="sm:col-span-2">
                                        <h3 className="font-semibold">
                                            Hasil proses
                                        </h3>
                                        <p className="text-xs text-muted-foreground">
                                            Hasil ini akan memperbarui data
                                            kendaraan dan STNK.
                                        </p>
                                    </div>

                                    {process.process_type === 'annual_tax' && (
                                        <div className="grid gap-1.5 sm:col-span-2">
                                            <Label htmlFor="annual-tax-due">
                                                Jatuh tempo pajak tahunan baru *
                                            </Label>
                                            <Input
                                                id="annual-tax-due"
                                                name="result[annual_tax_due_at]"
                                                type="date"
                                            />
                                            <InputError
                                                message={
                                                    errors[
                                                        'result.annual_tax_due_at'
                                                    ]
                                                }
                                            />
                                        </div>
                                    )}

                                    {process.process_type ===
                                        'five_year_tax' && (
                                        <div className="grid gap-1.5 sm:col-span-2">
                                            <Label htmlFor="stnk-expires-at">
                                                Masa berlaku STNK/plat baru *
                                            </Label>
                                            <Input
                                                id="stnk-expires-at"
                                                name="result[stnk_expires_at]"
                                                type="date"
                                            />
                                            <InputError
                                                message={
                                                    errors[
                                                        'result.stnk_expires_at'
                                                    ]
                                                }
                                            />
                                        </div>
                                    )}

                                    {['name_transfer', 'mutation'].includes(
                                        process.process_type,
                                    ) && (
                                        <>
                                            <div className="grid gap-1.5">
                                                <Label htmlFor="result-owner">
                                                    Nama pemilik pada dokumen
                                                </Label>
                                                <Input
                                                    id="result-owner"
                                                    name="result[owner_name]"
                                                    defaultValue={
                                                        process.target_owner_name ??
                                                        ''
                                                    }
                                                />
                                            </div>
                                            <div className="grid gap-1.5">
                                                <Label htmlFor="result-plate">
                                                    Nomor polisi baru
                                                </Label>
                                                <Input
                                                    id="result-plate"
                                                    name="result[license_plate]"
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            {status === 'returned' && (
                                <div className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2">
                                    <div className="sm:col-span-2">
                                        <h3 className="font-semibold">
                                            Penerima dokumen
                                        </h3>
                                        <p className="text-xs text-muted-foreground">
                                            Catat pihak yang menerima dokumen
                                            hasil proses.
                                        </p>
                                    </div>
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="recipient-name">
                                            Nama penerima *
                                        </Label>
                                        <Input
                                            id="recipient-name"
                                            name="recipient_name"
                                        />
                                        <InputError
                                            message={errors.recipient_name}
                                        />
                                    </div>
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="recipient-phone">
                                            Nomor telepon
                                        </Label>
                                        <Input
                                            id="recipient-phone"
                                            name="recipient_phone"
                                        />
                                    </div>
                                    <div className="grid gap-1.5 sm:col-span-2">
                                        <Label htmlFor="recipient-relation">
                                            Hubungan / jabatan
                                        </Label>
                                        <Input
                                            id="recipient-relation"
                                            name="recipient_relation"
                                            placeholder="Contoh: Pemilik, keluarga, petugas showroom"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="grid gap-1.5 sm:col-span-2">
                                    <Label htmlFor="event-files">
                                        Bukti kejadian
                                    </Label>
                                    <Input
                                        id="event-files"
                                        name="files[]"
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg,.png,.webp"
                                        multiple
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Maksimal 5 file, masing-masing 5 MB.
                                    </p>
                                    <InputError message={errors.files} />
                                </div>
                                <div className="grid gap-1.5 sm:col-span-2">
                                    <Label htmlFor="event-notes">Catatan</Label>
                                    <Textarea
                                        id="event-notes"
                                        name="notes"
                                        rows={3}
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
                                    {processing ? (
                                        <Spinner />
                                    ) : (
                                        <FloppyDiskIcon />
                                    )}
                                    Simpan perkembangan
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}

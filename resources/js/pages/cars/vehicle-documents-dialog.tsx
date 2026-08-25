import { Form } from '@inertiajs/react';
import {
    DownloadSimpleIcon,
    FileTextIcon,
    FloppyDiskIcon,
    InfoIcon,
} from '@phosphor-icons/react';
import { useState } from 'react';
import VehicleDocumentController from '@/actions/App/Http/Controllers/VehicleDocumentController';
import InputError from '@/components/input-error';
import { StatusBadge } from '@/components/status-badge';
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
import type {
    Car,
    VehicleDocument,
    VehicleDocumentStatus,
} from '@/pages/cars/types';
import {
    bpkbStatusOptions,
    formatFileSize,
    getDocumentStatusLabel,
    invoiceStatusOptions,
    stnkStatusOptions,
} from '@/pages/cars/vehicle-document-utils';

type Props = {
    car: Car | null;
    onOpenChange: (open: boolean) => void;
};

const validationColorClassName =
    'aria-invalid:border-red-500 aria-invalid:ring-red-500/20 dark:aria-invalid:ring-red-500/40';
const errorTextClassName = 'text-red-500 dark:text-red-500';

function findDocument(
    car: Car,
    type: 'stnk' | 'bpkb' | 'invoice',
): VehicleDocument | undefined {
    return car.documents?.find((document) => document.document_type === type);
}

function DocumentStatus({ document }: { document?: VehicleDocument }) {
    if (!document) {
        return <StatusBadge status="incomplete" label="Belum diisi" />;
    }

    return (
        <StatusBadge
            status={document.status}
            label={getDocumentStatusLabel(
                document.document_type,
                document.status,
            )}
        />
    );
}

function VehicleDocumentsForm({
    car,
    onSuccess,
}: {
    car: Car;
    onSuccess: () => void;
}) {
    const stnk = findDocument(car, 'stnk');
    const bpkb = findDocument(car, 'bpkb');
    const invoice = findDocument(car, 'invoice');
    const attachment = car.document_attachment;
    const [stnkStatus, setStnkStatus] = useState<VehicleDocumentStatus>(
        stnk?.status ?? 'incomplete',
    );
    const [bpkbStatus, setBpkbStatus] = useState<VehicleDocumentStatus>(
        bpkb?.status ?? 'printing',
    );
    const [invoiceStatus, setInvoiceStatus] = useState<VehicleDocumentStatus>(
        invoice?.status ?? 'not_ready',
    );
    const [removeFile, setRemoveFile] = useState(false);
    const attachmentSize = attachment
        ? formatFileSize(attachment.file_size)
        : null;

    return (
        <Form
            {...VehicleDocumentController.store.form(car.id)}
            options={{ preserveScroll: true }}
            onSuccess={onSuccess}
            className="flex min-h-0 flex-1 flex-col"
        >
            {({ processing, errors }) => (
                <>
                    <input
                        type="hidden"
                        name="stnk[status]"
                        value={stnkStatus}
                    />
                    <input
                        type="hidden"
                        name="bpkb[status]"
                        value={bpkbStatus}
                    />
                    <input
                        type="hidden"
                        name="invoice[status]"
                        value={invoiceStatus}
                    />
                    <input
                        type="hidden"
                        name="remove_file"
                        value={removeFile ? '1' : '0'}
                    />

                    <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
                        <section className="space-y-4 rounded-xl border bg-card p-4 shadow-xs">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <h3 className="font-semibold">STNK</h3>
                                    <p className="text-xs text-muted-foreground">
                                        Data kepemilikan dan masa berlaku STNK.
                                    </p>
                                </div>
                                <DocumentStatus document={stnk} />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="stnk-status">
                                        Status <span className="text-red-500">*</span>
                                    </Label>
                                    <Select
                                        value={stnkStatus}
                                        onValueChange={(value) =>
                                            setStnkStatus(
                                                value as VehicleDocumentStatus,
                                            )
                                        }
                                    >
                                        <SelectTrigger
                                            id="stnk-status"
                                            aria-invalid={Boolean(
                                                errors['stnk.status'],
                                            )}
                                            className={validationColorClassName}
                                        >
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {stnkStatusOptions.map((option) => (
                                                <SelectItem
                                                    key={option.value}
                                                    value={option.value}
                                                >
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError
                                        message={errors['stnk.status']}
                                        className={errorTextClassName}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="stnk-owner">
                                        Nama pemilik
                                    </Label>
                                    <Input
                                        id="stnk-owner"
                                        name="stnk[owner_name]"
                                        defaultValue={stnk?.owner_name ?? ''}
                                        maxLength={100}
                                        placeholder="Nama yang tercantum di STNK"
                                        aria-invalid={Boolean(
                                            errors['stnk.owner_name'],
                                        )}
                                        className={validationColorClassName}
                                    />
                                    <InputError
                                        message={errors['stnk.owner_name']}
                                        className={errorTextClassName}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="stnk-issued">
                                        Tanggal terbit
                                    </Label>
                                    <Input
                                        id="stnk-issued"
                                        name="stnk[issued_at]"
                                        type="date"
                                        defaultValue={
                                            stnk?.issued_at?.slice(0, 10) ?? ''
                                        }
                                        aria-invalid={Boolean(
                                            errors['stnk.issued_at'],
                                        )}
                                        className={validationColorClassName}
                                    />
                                    <InputError
                                        message={errors['stnk.issued_at']}
                                        className={errorTextClassName}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="stnk-expires">
                                        Berlaku STNK/plat sampai
                                    </Label>
                                    <Input
                                        id="stnk-expires"
                                        name="stnk[expires_at]"
                                        type="date"
                                        defaultValue={
                                            stnk?.expires_at?.slice(0, 10) ?? ''
                                        }
                                        aria-invalid={Boolean(
                                            errors['stnk.expires_at'],
                                        )}
                                        className={validationColorClassName}
                                    />
                                    <InputError
                                        message={errors['stnk.expires_at']}
                                        className={errorTextClassName}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="stnk-annual-tax-due">
                                        Jatuh tempo pajak tahunan
                                    </Label>
                                    <Input
                                        id="stnk-annual-tax-due"
                                        name="stnk[annual_tax_due_at]"
                                        type="date"
                                        defaultValue={
                                            stnk?.annual_tax_due_at?.slice(
                                                0,
                                                10,
                                            ) ?? ''
                                        }
                                        aria-invalid={Boolean(
                                            errors['stnk.annual_tax_due_at'],
                                        )}
                                        className={validationColorClassName}
                                    />
                                    <InputError
                                        message={
                                            errors['stnk.annual_tax_due_at']
                                        }
                                        className={errorTextClassName}
                                    />
                                </div>
                            </div>

                            {stnkStatus === 'complete' && (
                                <div className="flex gap-2 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
                                    <InfoIcon className="mt-0.5 size-4 shrink-0" />
                                    Nama pemilik, tanggal terbit, dan masa
                                    berlaku wajib diisi ketika STNK lengkap.
                                </div>
                            )}
                        </section>

                        <section className="space-y-4 rounded-xl border bg-card p-4 shadow-xs">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <h3 className="font-semibold">BPKB</h3>
                                    <p className="text-xs text-muted-foreground">
                                        Status penerbitan dan data pemilik BPKB.
                                    </p>
                                </div>
                                <DocumentStatus document={bpkb} />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-3">
                                <div className="grid gap-2">
                                    <Label htmlFor="bpkb-status">
                                        Status <span className="text-red-500">*</span>
                                    </Label>
                                    <Select
                                        value={bpkbStatus}
                                        onValueChange={(value) =>
                                            setBpkbStatus(
                                                value as VehicleDocumentStatus,
                                            )
                                        }
                                    >
                                        <SelectTrigger
                                            id="bpkb-status"
                                            aria-invalid={Boolean(
                                                errors['bpkb.status'],
                                            )}
                                            className={validationColorClassName}
                                        >
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {bpkbStatusOptions.map((option) => (
                                                <SelectItem
                                                    key={option.value}
                                                    value={option.value}
                                                >
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError
                                        message={errors['bpkb.status']}
                                        className={errorTextClassName}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="bpkb-owner">
                                        Nama pemilik
                                    </Label>
                                    <Input
                                        id="bpkb-owner"
                                        name="bpkb[owner_name]"
                                        defaultValue={bpkb?.owner_name ?? ''}
                                        maxLength={100}
                                        placeholder="Nama yang tercantum di BPKB"
                                        aria-invalid={Boolean(
                                            errors['bpkb.owner_name'],
                                        )}
                                        className={validationColorClassName}
                                    />
                                    <InputError
                                        message={errors['bpkb.owner_name']}
                                        className={errorTextClassName}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="bpkb-issued">
                                        Tanggal terbit
                                    </Label>
                                    <Input
                                        id="bpkb-issued"
                                        name="bpkb[issued_at]"
                                        type="date"
                                        defaultValue={
                                            bpkb?.issued_at?.slice(0, 10) ?? ''
                                        }
                                        aria-invalid={Boolean(
                                            errors['bpkb.issued_at'],
                                        )}
                                        className={validationColorClassName}
                                    />
                                    <InputError
                                        message={errors['bpkb.issued_at']}
                                        className={errorTextClassName}
                                    />
                                </div>
                            </div>
                        </section>

                        <section className="space-y-4 rounded-xl border bg-card p-4 shadow-xs">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <h3 className="font-semibold">
                                        Faktur kendaraan
                                    </h3>
                                    <p className="text-xs text-muted-foreground">
                                        Faktur hanya memerlukan status
                                        ketersediaan.
                                    </p>
                                </div>
                                <DocumentStatus document={invoice} />
                            </div>

                            <div className="grid max-w-sm gap-2">
                                <Label htmlFor="invoice-status">
                                    Status <span className="text-red-500">*</span>
                                </Label>
                                <Select
                                    value={invoiceStatus}
                                    onValueChange={(value) =>
                                        setInvoiceStatus(
                                            value as VehicleDocumentStatus,
                                        )
                                    }
                                >
                                    <SelectTrigger
                                        id="invoice-status"
                                        aria-invalid={Boolean(
                                            errors['invoice.status'],
                                        )}
                                        className={validationColorClassName}
                                    >
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {invoiceStatusOptions.map((option) => (
                                            <SelectItem
                                                key={option.value}
                                                value={option.value}
                                            >
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError
                                    message={errors['invoice.status']}
                                    className={errorTextClassName}
                                />
                            </div>
                        </section>

                        <section className="space-y-4 rounded-xl border bg-muted/20 p-4">
                            <div>
                                <h3 className="font-semibold">
                                    Lampiran dokumen
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                    Satu file bersama untuk seluruh data dokumen
                                    kendaraan. PDF/JPG/PNG, maksimal 5 MB.
                                </p>
                            </div>

                            {attachment?.file_name && (
                                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-background p-3">
                                    <div className="flex min-w-0 items-center gap-3">
                                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                            <FileTextIcon className="size-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="truncate text-sm font-medium">
                                                {attachment.file_name}
                                            </div>
                                            {attachmentSize && (
                                                <div className="text-xs text-muted-foreground">
                                                    {attachmentSize}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        asChild
                                    >
                                        <a
                                            href={VehicleDocumentController.download.url(
                                                car.id,
                                            )}
                                        >
                                            <DownloadSimpleIcon className="size-4" />
                                            Unduh
                                        </a>
                                    </Button>
                                </div>
                            )}

                            <div className="grid gap-2">
                                <Label htmlFor="vehicle-document-file">
                                    {attachment?.file_name
                                        ? 'Ganti lampiran'
                                        : 'Pilih lampiran'}
                                </Label>
                                <Input
                                    id="vehicle-document-file"
                                    name="file"
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    aria-invalid={Boolean(errors.file)}
                                    className={validationColorClassName}
                                />
                                <InputError
                                    message={errors.file}
                                    className={errorTextClassName}
                                />
                            </div>

                            {attachment?.file_name && (
                                <div className="flex items-start gap-3">
                                    <Checkbox
                                        id="remove-document-file"
                                        checked={removeFile}
                                        onCheckedChange={(checked) =>
                                            setRemoveFile(checked === true)
                                        }
                                    />
                                    <div className="grid gap-0.5">
                                        <Label
                                            htmlFor="remove-document-file"
                                            className="font-normal"
                                        >
                                            Hapus lampiran saat menyimpan
                                        </Label>
                                        <p className="text-xs text-muted-foreground">
                                            Data STNK, BPKB, dan faktur tetap
                                            tersimpan.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </section>
                    </div>

                    <DialogFooter className="border-t bg-background px-6 py-4">
                        <DialogClose asChild>
                            <Button type="button" variant="outline">
                                Batal
                            </Button>
                        </DialogClose>
                        <Button type="submit" disabled={processing}>
                            {processing ? (
                                <Spinner />
                            ) : (
                                <FloppyDiskIcon className="size-4" />
                            )}
                            Simpan data dokumen
                        </Button>
                    </DialogFooter>
                </>
            )}
        </Form>
    );
}

export function VehicleDocumentsDialog({ car, onOpenChange }: Props) {
    return (
        <Dialog
            open={car !== null}
            onOpenChange={(open) => {
                if (!open) {
                    onOpenChange(false);
                }
            }}
        >
            <DialogContent className="flex max-h-[92vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
                {car && (
                    <>
                        <DialogHeader className="border-b px-6 py-5 pr-14">
                            <DialogTitle>Dokumen kendaraan</DialogTitle>
                            <DialogDescription>
                                Kelola STNK, BPKB, faktur, dan satu lampiran
                                bersama untuk {car.brand?.name} {car.name}.
                            </DialogDescription>
                        </DialogHeader>
                        <VehicleDocumentsForm
                            key={car.id}
                            car={car}
                            onSuccess={() => onOpenChange(false)}
                        />
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}

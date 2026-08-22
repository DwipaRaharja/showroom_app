import { Form } from '@inertiajs/react';
import {
    DownloadSimpleIcon,
    FileTextIcon,
    FloppyDiskIcon,
    PencilSimpleIcon,
    PlusIcon,
    TrashIcon,
    WarningCircleIcon,
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
import { Textarea } from '@/components/ui/textarea';
import type {
    Car,
    VehicleDocument,
    VehicleDocumentStatus,
    VehicleDocumentType,
} from '@/pages/cars/types';
import {
    countCompleteRequiredDocuments,
    documentStatusOptions,
    documentTypeOptions,
    formatFileSize,
    getCarDocumentState,
    getDocumentTypeLabel,
    getEffectiveDocumentStatus,
    requiredDocumentTypes,
} from '@/pages/cars/vehicle-document-utils';

type Props = {
    car: Car | null;
    onOpenChange: (open: boolean) => void;
};

const validationColorClassName =
    'aria-invalid:border-red-500 aria-invalid:ring-red-500/20 dark:aria-invalid:ring-red-500/40';
const errorTextClassName = 'text-red-500 dark:text-red-500';

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
});

function formatDate(value: string | null): string {
    if (!value) {
        return '—';
    }

    return dateFormatter.format(new Date(`${value.slice(0, 10)}T00:00:00`));
}

function DocumentForm({
    car,
    document,
    onCancel,
    onSuccess,
}: {
    car: Car;
    document: VehicleDocument | null;
    onCancel: () => void;
    onSuccess: () => void;
}) {
    const documents = car.documents ?? [];
    const firstAvailableType = documentTypeOptions.find(
        (option) =>
            option.value === document?.document_type ||
            !documents.some(
                (candidate) => candidate.document_type === option.value,
            ),
    )?.value;
    const [documentType, setDocumentType] = useState<VehicleDocumentType>(
        document?.document_type ?? firstAvailableType ?? 'other',
    );
    const [status, setStatus] = useState<VehicleDocumentStatus>(
        document?.status ?? 'pending',
    );
    const [originalReceived, setOriginalReceived] = useState(
        document?.original_received ?? false,
    );
    const [removeFile, setRemoveFile] = useState(false);
    const isEditing = document !== null;
    const formDefinition = isEditing
        ? VehicleDocumentController.update.form(document.id)
        : VehicleDocumentController.store.form(car.id);

    return (
        <>
            <DialogHeader>
                <DialogTitle>
                    {isEditing
                        ? 'Edit dokumen kendaraan'
                        : 'Tambah dokumen kendaraan'}
                </DialogTitle>
                <DialogDescription>
                    {isEditing
                        ? `Perbarui ${getDocumentTypeLabel(document.document_type)} untuk ${car.name}.`
                        : `Catat surat atau berkas kendaraan untuk ${car.name}.`}
                </DialogDescription>
            </DialogHeader>

            <Form
                {...formDefinition}
                options={{ preserveScroll: true }}
                onSuccess={onSuccess}
                className="space-y-5"
            >
                {({ processing, errors }) => (
                    <>
                        <input
                            type="hidden"
                            name="document_type"
                            value={documentType}
                        />
                        <input type="hidden" name="status" value={status} />
                        <input
                            type="hidden"
                            name="original_received"
                            value={originalReceived ? '1' : '0'}
                        />
                        <input
                            type="hidden"
                            name="remove_file"
                            value={removeFile ? '1' : '0'}
                        />

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="vehicle-document-type">
                                    Jenis dokumen
                                </Label>
                                <Select
                                    value={documentType}
                                    onValueChange={(value) =>
                                        setDocumentType(
                                            value as VehicleDocumentType,
                                        )
                                    }
                                >
                                    <SelectTrigger
                                        id="vehicle-document-type"
                                        aria-invalid={Boolean(
                                            errors.document_type,
                                        )}
                                        className={validationColorClassName}
                                    >
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {documentTypeOptions.map((option) => {
                                            const isUsed = documents.some(
                                                (candidate) =>
                                                    candidate.document_type ===
                                                        option.value &&
                                                    candidate.id !==
                                                        document?.id,
                                            );

                                            return (
                                                <SelectItem
                                                    key={option.value}
                                                    value={option.value}
                                                    disabled={isUsed}
                                                >
                                                    {option.label}
                                                    {option.required
                                                        ? ' • Wajib'
                                                        : ''}
                                                </SelectItem>
                                            );
                                        })}
                                    </SelectContent>
                                </Select>
                                <InputError
                                    message={errors.document_type}
                                    className={errorTextClassName}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="vehicle-document-status">
                                    Status dokumen
                                </Label>
                                <Select
                                    value={status}
                                    onValueChange={(value) =>
                                        setStatus(
                                            value as VehicleDocumentStatus,
                                        )
                                    }
                                >
                                    <SelectTrigger
                                        id="vehicle-document-status"
                                        aria-invalid={Boolean(errors.status)}
                                        className={validationColorClassName}
                                    >
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {documentStatusOptions.map((option) => (
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
                                    message={errors.status}
                                    className={errorTextClassName}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="vehicle-document-number">
                                    Nomor dokumen
                                </Label>
                                <Input
                                    id="vehicle-document-number"
                                    name="document_number"
                                    defaultValue={
                                        document?.document_number ?? ''
                                    }
                                    maxLength={100}
                                    placeholder="Contoh: 01234567"
                                    aria-invalid={Boolean(
                                        errors.document_number,
                                    )}
                                    className={validationColorClassName}
                                />
                                <InputError
                                    message={errors.document_number}
                                    className={errorTextClassName}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="vehicle-document-owner">
                                    Nama pemilik
                                </Label>
                                <Input
                                    id="vehicle-document-owner"
                                    name="owner_name"
                                    defaultValue={document?.owner_name ?? ''}
                                    maxLength={100}
                                    placeholder="Nama pada dokumen"
                                    aria-invalid={Boolean(errors.owner_name)}
                                    className={validationColorClassName}
                                />
                                <InputError
                                    message={errors.owner_name}
                                    className={errorTextClassName}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="vehicle-document-issued">
                                    Tanggal terbit
                                </Label>
                                <Input
                                    id="vehicle-document-issued"
                                    name="issued_at"
                                    type="date"
                                    defaultValue={
                                        document?.issued_at?.slice(0, 10) ?? ''
                                    }
                                    aria-invalid={Boolean(errors.issued_at)}
                                    className={validationColorClassName}
                                />
                                <InputError
                                    message={errors.issued_at}
                                    className={errorTextClassName}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="vehicle-document-expires">
                                    Berlaku sampai
                                </Label>
                                <Input
                                    id="vehicle-document-expires"
                                    name="expires_at"
                                    type="date"
                                    defaultValue={
                                        document?.expires_at?.slice(0, 10) ?? ''
                                    }
                                    aria-invalid={Boolean(errors.expires_at)}
                                    className={validationColorClassName}
                                />
                                <InputError
                                    message={errors.expires_at}
                                    className={errorTextClassName}
                                />
                            </div>
                        </div>

                        <div className="flex items-start gap-3 rounded-lg border p-3">
                            <Checkbox
                                id="vehicle-document-original"
                                checked={originalReceived}
                                onCheckedChange={(checked) =>
                                    setOriginalReceived(checked === true)
                                }
                                aria-invalid={Boolean(errors.original_received)}
                            />
                            <div className="grid gap-1">
                                <Label htmlFor="vehicle-document-original">
                                    Dokumen asli sudah diterima
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                    Kelengkapan inti baru dihitung lengkap jika
                                    dokumen berstatus lengkap dan fisik aslinya
                                    sudah diterima.
                                </p>
                                <InputError
                                    message={errors.original_received}
                                    className={errorTextClassName}
                                />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="vehicle-document-file">
                                Berkas digital
                            </Label>
                            <Input
                                id="vehicle-document-file"
                                name="file"
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                                aria-invalid={Boolean(errors.file)}
                                className={validationColorClassName}
                            />
                            <p className="text-xs text-muted-foreground">
                                PDF, JPG, atau PNG maksimal 5 MB. Berkas
                                disimpan privat.
                            </p>
                            {document?.file_name && (
                                <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-xs">
                                    <FileTextIcon className="size-4 shrink-0" />
                                    <span className="min-w-0 flex-1 truncate">
                                        {document.file_name}
                                    </span>
                                    <label className="flex cursor-pointer items-center gap-2">
                                        <Checkbox
                                            checked={removeFile}
                                            onCheckedChange={(checked) =>
                                                setRemoveFile(checked === true)
                                            }
                                        />
                                        Hapus berkas lama
                                    </label>
                                </div>
                            )}
                            <InputError
                                message={errors.file}
                                className={errorTextClassName}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="vehicle-document-notes">
                                Catatan
                            </Label>
                            <Textarea
                                id="vehicle-document-notes"
                                name="notes"
                                defaultValue={document?.notes ?? ''}
                                rows={3}
                                maxLength={2000}
                                placeholder="Catatan kondisi atau lokasi dokumen fisik"
                                aria-invalid={Boolean(errors.notes)}
                                className={validationColorClassName}
                            />
                            <InputError
                                message={errors.notes}
                                className={errorTextClassName}
                            />
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onCancel}
                                disabled={processing}
                            >
                                Batal
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {processing ? <Spinner /> : <FloppyDiskIcon />}
                                {isEditing
                                    ? 'Simpan perubahan'
                                    : 'Tambah dokumen'}
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </Form>
        </>
    );
}

function DeleteDocument({
    document,
    onCancel,
    onSuccess,
}: {
    document: VehicleDocument;
    onCancel: () => void;
    onSuccess: () => void;
}) {
    return (
        <>
            <DialogHeader>
                <div className="mb-1 flex size-11 items-center justify-center rounded-full bg-red-500/10 text-red-500">
                    <WarningCircleIcon className="size-6" weight="fill" />
                </div>
                <DialogTitle>Hapus dokumen kendaraan?</DialogTitle>
                <DialogDescription>
                    Data {getDocumentTypeLabel(document.document_type)} dan
                    berkas digitalnya akan dihapus permanen.
                </DialogDescription>
            </DialogHeader>
            <Form
                {...VehicleDocumentController.destroy.form(document.id)}
                options={{ preserveScroll: true }}
                onSuccess={onSuccess}
            >
                {({ processing }) => (
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onCancel}
                            disabled={processing}
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            className="bg-red-500 text-white hover:bg-red-500/90"
                            disabled={processing}
                        >
                            {processing ? <Spinner /> : <TrashIcon />}
                            Hapus dokumen
                        </Button>
                    </DialogFooter>
                )}
            </Form>
        </>
    );
}

function DocumentList({
    car,
    onEdit,
    onDelete,
}: {
    car: Car;
    onEdit: (document: VehicleDocument | null) => void;
    onDelete: (document: VehicleDocument) => void;
}) {
    const documents = car.documents ?? [];
    const state = getCarDocumentState(documents);
    const completeCount = countCompleteRequiredDocuments(documents);
    const canAdd = documents.length < documentTypeOptions.length;

    return (
        <>
            <DialogHeader>
                <DialogTitle>Surat & dokumen kendaraan</DialogTitle>
                <DialogDescription>
                    {car.brand?.name} {car.name} •{' '}
                    {car.license_plate || 'Tanpa plat nomor'}
                </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-3 rounded-xl border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold">
                            Kelengkapan inti {completeCount}/
                            {requiredDocumentTypes.length}
                        </span>
                        <StatusBadge status={state} />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                        STNK, BPKB, Faktur kendaraan, dan Kuitansi pembelian.
                    </p>
                </div>
                <Button
                    type="button"
                    onClick={() => onEdit(null)}
                    disabled={!canAdd}
                >
                    <PlusIcon />
                    Tambah dokumen
                </Button>
            </div>

            <div className="max-h-[52vh] space-y-3 overflow-y-auto pr-1">
                {documents.length === 0 ? (
                    <div className="rounded-xl border border-dashed p-8 text-center">
                        <FileTextIcon className="mx-auto size-9 text-muted-foreground" />
                        <p className="mt-3 font-medium">
                            Belum ada dokumen tercatat
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Mulai dari dokumen inti agar kelengkapan unit mudah
                            dipantau.
                        </p>
                    </div>
                ) : (
                    documents.map((document) => {
                        const fileSize = formatFileSize(document.file_size);

                        return (
                            <article
                                key={document.id}
                                className="rounded-xl border bg-card p-4 shadow-xs"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                        <FileTextIcon
                                            className="size-5"
                                            weight="fill"
                                        />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h3 className="font-semibold">
                                                {getDocumentTypeLabel(
                                                    document.document_type,
                                                )}
                                            </h3>
                                            <StatusBadge
                                                status={getEffectiveDocumentStatus(
                                                    document,
                                                )}
                                            />
                                            <StatusBadge
                                                status={
                                                    document.original_received
                                                        ? 'active'
                                                        : 'inactive'
                                                }
                                                label={
                                                    document.original_received
                                                        ? 'Asli diterima'
                                                        : 'Asli belum diterima'
                                                }
                                            />
                                        </div>
                                        <div className="mt-2 grid gap-x-5 gap-y-1 text-xs text-muted-foreground sm:grid-cols-2">
                                            <span>
                                                Nomor:{' '}
                                                <strong className="font-medium text-foreground">
                                                    {document.document_number ||
                                                        '—'}
                                                </strong>
                                            </span>
                                            <span>
                                                Pemilik:{' '}
                                                <strong className="font-medium text-foreground">
                                                    {document.owner_name || '—'}
                                                </strong>
                                            </span>
                                            <span>
                                                Terbit:{' '}
                                                <strong className="font-medium text-foreground">
                                                    {formatDate(
                                                        document.issued_at,
                                                    )}
                                                </strong>
                                            </span>
                                            <span>
                                                Berlaku sampai:{' '}
                                                <strong className="font-medium text-foreground">
                                                    {formatDate(
                                                        document.expires_at,
                                                    )}
                                                </strong>
                                            </span>
                                        </div>
                                        {document.notes && (
                                            <p className="mt-2 text-xs text-muted-foreground">
                                                {document.notes}
                                            </p>
                                        )}
                                        {document.file_name && (
                                            <a
                                                href={
                                                    VehicleDocumentController.download(
                                                        document.id,
                                                    ).url
                                                }
                                                className="mt-3 inline-flex max-w-full items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                                            >
                                                <DownloadSimpleIcon className="size-4 shrink-0" />
                                                <span className="truncate">
                                                    {document.file_name}
                                                </span>
                                                {fileSize && (
                                                    <span className="shrink-0 text-muted-foreground">
                                                        ({fileSize})
                                                    </span>
                                                )}
                                            </a>
                                        )}
                                    </div>
                                    <div className="flex shrink-0 items-center gap-1">
                                        <Button
                                            type="button"
                                            size="icon"
                                            variant="ghost"
                                            className="size-8"
                                            onClick={() => onEdit(document)}
                                            aria-label={`Edit ${getDocumentTypeLabel(document.document_type)}`}
                                        >
                                            <PencilSimpleIcon />
                                        </Button>
                                        <Button
                                            type="button"
                                            size="icon"
                                            variant="ghost"
                                            className="size-8 text-red-500 hover:text-red-500"
                                            onClick={() => onDelete(document)}
                                            aria-label={`Hapus ${getDocumentTypeLabel(document.document_type)}`}
                                        >
                                            <TrashIcon className="text-red-500" />
                                        </Button>
                                    </div>
                                </div>
                            </article>
                        );
                    })
                )}
            </div>

            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button">Tutup</Button>
                </DialogClose>
            </DialogFooter>
        </>
    );
}

function VehicleDocumentsContent({
    car,
    onOpenChange,
}: {
    car: Car;
    onOpenChange: (open: boolean) => void;
}) {
    const [editingDocument, setEditingDocument] = useState<
        VehicleDocument | null | undefined
    >(undefined);
    const [deletingDocument, setDeletingDocument] =
        useState<VehicleDocument | null>(null);

    if (deletingDocument) {
        return (
            <DialogContent className="sm:max-w-md">
                <DeleteDocument
                    document={deletingDocument}
                    onCancel={() => setDeletingDocument(null)}
                    onSuccess={() => onOpenChange(false)}
                />
            </DialogContent>
        );
    }

    if (editingDocument !== undefined) {
        return (
            <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
                <DocumentForm
                    key={editingDocument?.id ?? 'new'}
                    car={car}
                    document={editingDocument}
                    onCancel={() => setEditingDocument(undefined)}
                    onSuccess={() => onOpenChange(false)}
                />
            </DialogContent>
        );
    }

    return (
        <DialogContent className="gap-4 sm:max-w-3xl">
            <DocumentList
                car={car}
                onEdit={setEditingDocument}
                onDelete={setDeletingDocument}
            />
        </DialogContent>
    );
}

export function VehicleDocumentsDialog({ car, onOpenChange }: Props) {
    return (
        <Dialog open={car !== null} onOpenChange={onOpenChange}>
            {car && (
                <VehicleDocumentsContent
                    car={car}
                    onOpenChange={onOpenChange}
                />
            )}
        </Dialog>
    );
}

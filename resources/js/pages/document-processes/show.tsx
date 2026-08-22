import { Form, Head, Link } from '@inertiajs/react';
import {
    ArrowCounterClockwiseIcon,
    ArrowLeftIcon,
    CalendarBlankIcon,
    CarProfileIcon,
    CheckCircleIcon,
    ClockIcon,
    FileTextIcon,
    FloppyDiskIcon,
    PencilSimpleIcon,
    ProhibitIcon,
    UserIcon,
    WarningCircleIcon,
} from '@phosphor-icons/react';
import { useState } from 'react';
import DocumentProcessController from '@/actions/App/Http/Controllers/DocumentProcessController';
import DocumentProcessItemController from '@/actions/App/Http/Controllers/DocumentProcessItemController';
import SaleController from '@/actions/App/Http/Controllers/SaleController';
import InputError from '@/components/input-error';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
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
import { getDocumentTypeLabel } from '@/pages/cars/vehicle-document-utils';
import type {
    DocumentProcess,
    DocumentProcessItem,
    DocumentProcessItemStatus,
    DocumentProcessType,
    RecipientType,
    UserOption,
} from '@/pages/document-processes/types';
import {
    getItemStatusLabel,
    getProcessStatusLabel,
    getProcessTypeLabel,
    getRecipientTypeLabel,
    itemStatusOptions,
    processTypeOptions,
    recipientTypeOptions,
} from '@/pages/document-processes/utils';
import { index as documentProcessesIndex } from '@/routes/document-processes';

type Props = {
    process: DocumentProcess;
    users: UserOption[];
};

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
});

const dateTimeFormatter = new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
});

function toDateInput(value: string | null): string {
    return value?.slice(0, 10) ?? '';
}

function toDateTimeInput(value: string | null): string {
    if (value) return value.slice(0, 16);

    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
        .toISOString()
        .slice(0, 16);
}

function ProcessEditDialog({
    process,
    users,
    open,
    onOpenChange,
}: {
    process: DocumentProcess;
    users: UserOption[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const [processType, setProcessType] = useState<DocumentProcessType>(
        process.process_type,
    );
    const [assignee, setAssignee] = useState(
        process.assigned_to ? String(process.assigned_to) : 'none',
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Edit informasi proses</DialogTitle>
                    <DialogDescription>
                        Perbarui jenis proses, petugas, jadwal, dan catatan.
                    </DialogDescription>
                </DialogHeader>
                <Form
                    {...DocumentProcessController.update.form(process.id)}
                    onSuccess={() => onOpenChange(false)}
                    className="space-y-4"
                >
                    {({ processing, errors }) => (
                        <>
                            <input type="hidden" name="process_type" value={processType} />
                            <input
                                type="hidden"
                                name="assigned_to"
                                value={assignee === 'none' ? '' : assignee}
                            />
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="grid gap-2 sm:col-span-2">
                                    <Label>Jenis proses</Label>
                                    <Select
                                        value={processType}
                                        onValueChange={(value) =>
                                            setProcessType(value as DocumentProcessType)
                                        }
                                    >
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {processTypeOptions.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.process_type} />
                                </div>
                                <div className="grid gap-2 sm:col-span-2">
                                    <Label>Petugas</Label>
                                    <Select value={assignee} onValueChange={setAssignee}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Belum ditentukan</SelectItem>
                                            {users.map((user) => (
                                                <SelectItem key={user.id} value={String(user.id)}>
                                                    {user.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.assigned_to} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-process-start">Tanggal mulai</Label>
                                    <Input
                                        id="edit-process-start"
                                        name="started_at"
                                        type="date"
                                        defaultValue={toDateInput(process.started_at)}
                                        required
                                    />
                                    <InputError message={errors.started_at} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-process-estimated">Estimasi selesai</Label>
                                    <Input
                                        id="edit-process-estimated"
                                        name="estimated_completion_date"
                                        type="date"
                                        defaultValue={toDateInput(
                                            process.estimated_completion_date,
                                        )}
                                    />
                                    <InputError message={errors.estimated_completion_date} />
                                </div>
                                <div className="grid gap-2 sm:col-span-2">
                                    <Label htmlFor="edit-process-notes">Catatan</Label>
                                    <Textarea
                                        id="edit-process-notes"
                                        name="notes"
                                        rows={4}
                                        defaultValue={process.notes ?? ''}
                                    />
                                    <InputError message={errors.notes} />
                                </div>
                            </div>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button type="button" variant="outline">Batal</Button>
                                </DialogClose>
                                <Button type="submit" disabled={processing}>
                                    {processing ? <Spinner /> : <FloppyDiskIcon />}
                                    Simpan
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}

function ItemEditDialog({
    item,
    saleSettled,
    open,
    onOpenChange,
}: {
    item: DocumentProcessItem;
    saleSettled: boolean;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const [status, setStatus] = useState<DocumentProcessItemStatus>(item.status);
    const [recipientType, setRecipientType] = useState<RecipientType | 'none'>(
        item.recipient_type ?? 'none',
    );
    const isHandover = status === 'handed_over';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>
                        Perbarui {getDocumentTypeLabel(item.document_type)}
                    </DialogTitle>
                    <DialogDescription>
                        Catat progres dan penerima dokumen. Penyerahan hanya
                        tersedia setelah penjualan lunas.
                    </DialogDescription>
                </DialogHeader>
                <Form
                    {...DocumentProcessItemController.update.form(item.id)}
                    onSuccess={() => onOpenChange(false)}
                    className="space-y-4"
                >
                    {({ processing, errors }) => (
                        <>
                            <input type="hidden" name="status" value={status} />
                            <input
                                type="hidden"
                                name="recipient_type"
                                value={recipientType === 'none' ? '' : recipientType}
                            />
                            <div className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label>Status dokumen</Label>
                                    <Select
                                        value={status}
                                        onValueChange={(value) =>
                                            setStatus(value as DocumentProcessItemStatus)
                                        }
                                    >
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {itemStatusOptions.map((option) => (
                                                <SelectItem
                                                    key={option.value}
                                                    value={option.value}
                                                    disabled={
                                                        option.value === 'handed_over' &&
                                                        !saleSettled
                                                    }
                                                >
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.status} />
                                    {!saleSettled && (
                                        <p className="text-xs text-amber-600">
                                            Penyerahan terkunci karena penjualan belum lunas.
                                        </p>
                                    )}
                                </div>

                                <div className="grid gap-2 sm:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label>Jenis penerima</Label>
                                        <Select
                                            value={recipientType}
                                            onValueChange={(value) =>
                                                setRecipientType(
                                                    value as RecipientType | 'none',
                                                )
                                            }
                                        >
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">Belum ditentukan</SelectItem>
                                                {recipientTypeOptions.map((option) => (
                                                    <SelectItem
                                                        key={option.value}
                                                        value={option.value}
                                                    >
                                                        {option.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.recipient_type} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="item-recipient-name">Nama penerima</Label>
                                        <Input
                                            id="item-recipient-name"
                                            name="recipient_name"
                                            defaultValue={item.recipient_name ?? ''}
                                            required={isHandover}
                                        />
                                        <InputError message={errors.recipient_name} />
                                    </div>
                                </div>

                                {isHandover && (
                                    <div className="grid gap-2">
                                        <Label htmlFor="item-handover-at">Tanggal penyerahan</Label>
                                        <Input
                                            id="item-handover-at"
                                            name="handed_over_at"
                                            type="datetime-local"
                                            defaultValue={toDateTimeInput(item.handed_over_at)}
                                            required
                                        />
                                        <InputError message={errors.handed_over_at} />
                                    </div>
                                )}

                                <div className="grid gap-2">
                                    <Label htmlFor="item-notes">Catatan / kendala</Label>
                                    <Textarea
                                        id="item-notes"
                                        name="notes"
                                        rows={4}
                                        defaultValue={item.notes ?? ''}
                                    />
                                    <InputError message={errors.notes} />
                                </div>
                            </div>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button type="button" variant="outline">Batal</Button>
                                </DialogClose>
                                <Button type="submit" disabled={processing}>
                                    {processing ? <Spinner /> : <FloppyDiskIcon />}
                                    Simpan Checklist
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}

export default function DocumentProcessesShow({ process, users }: Props) {
    const [editingProcess, setEditingProcess] = useState(false);
    const [editingItem, setEditingItem] = useState<DocumentProcessItem | null>(null);
    const [confirmingCancel, setConfirmingCancel] = useState(false);
    const sale = process.sale;
    const car = sale.car;
    const items = process.items ?? [];
    const activities = process.activities ?? [];
    const saleSettled = sale.is_settled ?? sale.status === 'completed';

    return (
        <>
            <Head title={`Proses Berkas ${process.process_number}`} />
            <div className="flex h-full min-w-0 flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="icon" asChild>
                            <Link href={documentProcessesIndex.url()} aria-label="Kembali">
                                <ArrowLeftIcon />
                            </Link>
                        </Button>
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="font-mono text-xl font-bold">
                                    {process.process_number}
                                </h1>
                                <StatusBadge
                                    status={process.status}
                                    label={getProcessStatusLabel(process.status)}
                                />
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {getProcessTypeLabel(process.process_type)} ·{' '}
                                {sale.invoice_number}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" asChild>
                            <Link href={SaleController.show(sale.id)}>
                                <FileTextIcon />
                                Detail Penjualan
                            </Link>
                        </Button>
                        {process.status !== 'cancelled' ? (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={() => setEditingProcess(true)}
                                >
                                    <PencilSimpleIcon />
                                    Edit Proses
                                </Button>
                                <Button
                                    variant="outline"
                                    className="text-red-500 hover:text-red-500"
                                    onClick={() => setConfirmingCancel(true)}
                                >
                                    <ProhibitIcon className="text-red-500" />
                                    Batalkan
                                </Button>
                            </>
                        ) : (
                            <Form {...DocumentProcessController.reopen.form(process.id)}>
                                {({ processing }) => (
                                    <Button type="submit" disabled={processing}>
                                        {processing ? <Spinner /> : <ArrowCounterClockwiseIcon />}
                                        Buka Kembali
                                    </Button>
                                )}
                            </Form>
                        )}
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <Card className="gap-2 p-4">
                        <span className="text-xs text-muted-foreground">Progres checklist</span>
                        <div className="text-2xl font-bold">{process.progress_percentage}%</div>
                        <div className="h-2 rounded-full bg-muted">
                            <div
                                className="h-full rounded-full bg-primary"
                                style={{ width: `${process.progress_percentage}%` }}
                            />
                        </div>
                    </Card>
                    <Card className="gap-2 p-4">
                        <span className="text-xs text-muted-foreground">Petugas</span>
                        <div className="flex items-center gap-2 font-semibold">
                            <UserIcon />
                            {process.assignee?.name ?? 'Belum ditentukan'}
                        </div>
                    </Card>
                    <Card className="gap-2 p-4">
                        <span className="text-xs text-muted-foreground">Tanggal mulai</span>
                        <div className="flex items-center gap-2 font-semibold">
                            <CalendarBlankIcon />
                            {dateFormatter.format(new Date(process.started_at))}
                        </div>
                    </Card>
                    <Card className="gap-2 p-4">
                        <span className="text-xs text-muted-foreground">Estimasi selesai</span>
                        <div className="flex items-center gap-2 font-semibold">
                            <ClockIcon />
                            {process.estimated_completion_date
                                ? dateFormatter.format(
                                      new Date(process.estimated_completion_date),
                                  )
                                : 'Belum ditentukan'}
                        </div>
                    </Card>
                </div>

                {!saleSettled && (
                    <Card className="border-amber-500/30 bg-amber-500/5 p-4">
                        <div className="flex items-start gap-3">
                            <WarningCircleIcon className="mt-0.5 text-amber-600" />
                            <div>
                                <div className="font-semibold text-amber-700 dark:text-amber-500">
                                    Penjualan belum lunas
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Berkas dapat disiapkan dan diproses, tetapi belum dapat
                                    ditandai sudah diserahkan.
                                </p>
                            </div>
                        </div>
                    </Card>
                )}

                <div className="grid gap-6 xl:grid-cols-3">
                    <div className="space-y-6 xl:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Checklist Dokumen</CardTitle>
                                <CardDescription>
                                    Status keseluruhan dihitung otomatis dari dokumen wajib.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {items.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                                    >
                                        <div className="flex min-w-0 items-start gap-3">
                                            <div
                                                className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full ${['completed', 'handed_over'].includes(item.status) ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'}`}
                                            >
                                                {['completed', 'handed_over'].includes(item.status) ? (
                                                    <CheckCircleIcon weight="fill" />
                                                ) : (
                                                    <FileTextIcon />
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="font-semibold">
                                                        {getDocumentTypeLabel(item.document_type)}
                                                    </span>
                                                    {item.required && (
                                                        <span className="text-xs font-medium text-red-500">
                                                            Wajib
                                                        </span>
                                                    )}
                                                    <StatusBadge
                                                        status={item.status}
                                                        label={getItemStatusLabel(item.status)}
                                                    />
                                                </div>
                                                <div className="mt-1 text-xs text-muted-foreground">
                                                    Nomor: {item.document_number_snapshot ?? '—'} ·
                                                    Penerima: {getRecipientTypeLabel(item.recipient_type)}
                                                    {item.recipient_name
                                                        ? ` (${item.recipient_name})`
                                                        : ''}
                                                </div>
                                                {item.notes && (
                                                    <p className="mt-1 text-xs text-muted-foreground">
                                                        {item.notes}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={process.status === 'cancelled'}
                                            onClick={() => setEditingItem(item)}
                                        >
                                            <PencilSimpleIcon />
                                            Perbarui
                                        </Button>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Riwayat Aktivitas</CardTitle>
                                <CardDescription>
                                    Jejak perubahan selama proses berkas berlangsung.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {activities.map((activity) => (
                                        <div key={activity.id} className="flex gap-3">
                                            <div className="mt-1 size-2 shrink-0 rounded-full bg-primary" />
                                            <div className="min-w-0 border-b pb-4 last:border-0">
                                                <div className="text-sm font-medium">
                                                    {activity.description}
                                                </div>
                                                <div className="mt-1 text-xs text-muted-foreground">
                                                    {activity.user?.name ?? 'Sistem'} ·{' '}
                                                    {dateTimeFormatter.format(
                                                        new Date(activity.created_at),
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <CarProfileIcon />
                                    Unit & Customer
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm">
                                <div>
                                    <div className="font-semibold">
                                        {car?.brand?.name} {car?.name}
                                    </div>
                                    <div className="font-mono text-xs text-muted-foreground">
                                        {car?.license_plate ?? '—'} · {car?.year ?? '—'}
                                    </div>
                                </div>
                                <div className="border-t pt-3">
                                    <div className="font-semibold">
                                        {sale.customer?.name}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {sale.customer?.phone ?? 'Tanpa nomor telepon'}
                                    </div>
                                </div>
                                {sale.payment_type === 'credit' && (
                                    <div className="border-t pt-3">
                                        <div className="text-xs text-muted-foreground">Leasing</div>
                                        <div className="font-medium">
                                            {sale.finance_company?.name ?? '—'}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {process.notes && (
                            <Card>
                                <CardHeader><CardTitle className="text-base">Catatan Proses</CardTitle></CardHeader>
                                <CardContent className="text-sm text-muted-foreground">
                                    {process.notes}
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>

            {editingProcess && (
                <ProcessEditDialog
                    key={`${process.id}-${process.updated_at}`}
                    process={process}
                    users={users}
                    open
                    onOpenChange={setEditingProcess}
                />
            )}
            {editingItem && (
                <ItemEditDialog
                    key={`${editingItem.id}-${editingItem.updated_at}`}
                    item={editingItem}
                    saleSettled={saleSettled}
                    open
                    onOpenChange={(open) => {
                        if (!open) setEditingItem(null);
                    }}
                />
            )}
            <Dialog open={confirmingCancel} onOpenChange={setConfirmingCancel}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Batalkan proses berkas?</DialogTitle>
                        <DialogDescription>
                            Checklist dan riwayat tetap tersimpan. Proses dapat dibuka
                            kembali jika diperlukan.
                        </DialogDescription>
                    </DialogHeader>
                    <Form
                        {...DocumentProcessController.cancel.form(process.id)}
                        onSuccess={() => setConfirmingCancel(false)}
                    >
                        {({ processing }) => (
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button type="button" variant="outline">Kembali</Button>
                                </DialogClose>
                                <Button
                                    type="submit"
                                    variant="destructive"
                                    className="bg-red-500 hover:bg-red-500/90"
                                    disabled={processing}
                                >
                                    {processing ? <Spinner /> : <ProhibitIcon />}
                                    Batalkan Proses
                                </Button>
                            </DialogFooter>
                        )}
                    </Form>
                </DialogContent>
            </Dialog>
        </>
    );
}

DocumentProcessesShow.layout = {
    breadcrumbs: [
        { title: 'Proses Berkas', href: documentProcessesIndex.url() },
        { title: 'Detail Proses', href: '#' },
    ],
};

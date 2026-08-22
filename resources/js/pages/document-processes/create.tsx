import { Form, Head, Link } from '@inertiajs/react';
import {
    ArrowLeftIcon,
    CalendarBlankIcon,
    CarProfileIcon,
    FilesIcon,
    FloppyDiskIcon,
    UserIcon,
} from '@phosphor-icons/react';
import { useState } from 'react';
import DocumentProcessController from '@/actions/App/Http/Controllers/DocumentProcessController';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import InputError from '@/components/input-error';
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
    DocumentProcessSale,
    DocumentProcessType,
    UserOption,
} from '@/pages/document-processes/types';
import { processTypeOptions } from '@/pages/document-processes/utils';
import { getCarDocumentState } from '@/pages/cars/vehicle-document-utils';
import { index as documentProcessesIndex } from '@/routes/document-processes';

type Props = {
    sale: DocumentProcessSale;
    users: UserOption[];
};

function todayString() {
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
        .toISOString()
        .slice(0, 10);
}

export default function DocumentProcessesCreate({ sale, users }: Props) {
    const [processType, setProcessType] =
        useState<DocumentProcessType>('handover');
    const [assignee, setAssignee] = useState('none');
    const car = sale.car;
    const documentState = getCarDocumentState(car?.documents ?? []);

    return (
        <>
            <Head title={`Mulai Proses Berkas ${sale.invoice_number}`} />
            <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="icon" asChild>
                        <Link
                            href={documentProcessesIndex.url()}
                            aria-label="Kembali ke proses berkas"
                        >
                            <ArrowLeftIcon />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Mulai Proses Berkas
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Siapkan checklist dokumen untuk {sale.invoice_number}.
                        </p>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="space-y-4 lg:col-span-1">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <CarProfileIcon />
                                    Transaksi Penjualan
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                <div>
                                    <div className="text-xs text-muted-foreground">
                                        Unit mobil
                                    </div>
                                    <div className="font-semibold">
                                        {car?.brand?.name} {car?.name}
                                    </div>
                                    <div className="font-mono text-xs text-muted-foreground">
                                        {car?.license_plate ?? 'Tanpa plat'}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-muted-foreground">
                                        Customer
                                    </div>
                                    <div className="font-medium">
                                        {sale.customer?.name}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-muted-foreground">
                                        Kondisi dokumen
                                    </div>
                                    <div
                                        className={
                                            documentState === 'complete'
                                                ? 'font-medium text-emerald-600'
                                                : 'font-medium text-amber-600'
                                        }
                                    >
                                        {documentState === 'complete'
                                            ? 'Dokumen inti lengkap'
                                            : 'Masih ada dokumen yang belum lengkap'}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FilesIcon />
                                Informasi Proses
                            </CardTitle>
                            <CardDescription>
                                Checklist STNK, BPKB, faktur, dan kuitansi akan
                                dibuat otomatis dari dokumen kendaraan.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form
                                {...DocumentProcessController.store.form(sale.id)}
                                className="space-y-5"
                            >
                                {({ processing, errors }) => (
                                    <>
                                        <input
                                            type="hidden"
                                            name="process_type"
                                            value={processType}
                                        />
                                        <input
                                            type="hidden"
                                            name="assigned_to"
                                            value={assignee === 'none' ? '' : assignee}
                                        />

                                        <div className="grid gap-5 sm:grid-cols-2">
                                            <div className="grid gap-2 sm:col-span-2">
                                                <Label htmlFor="process-type">
                                                    Jenis proses
                                                </Label>
                                                <Select
                                                    value={processType}
                                                    onValueChange={(value) =>
                                                        setProcessType(
                                                            value as DocumentProcessType,
                                                        )
                                                    }
                                                >
                                                    <SelectTrigger id="process-type">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {processTypeOptions.map((option) => (
                                                            <SelectItem
                                                                key={option.value}
                                                                value={option.value}
                                                            >
                                                                {option.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <InputError message={errors.process_type} />
                                            </div>

                                            <div className="grid gap-2 sm:col-span-2">
                                                <Label htmlFor="process-assignee">
                                                    <UserIcon className="inline size-4" />{' '}
                                                    Petugas penanggung jawab
                                                </Label>
                                                <Select
                                                    value={assignee}
                                                    onValueChange={setAssignee}
                                                >
                                                    <SelectTrigger id="process-assignee">
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
                                                <InputError message={errors.assigned_to} />
                                            </div>

                                            <div className="grid gap-2">
                                                <Label htmlFor="process-started">
                                                    <CalendarBlankIcon className="inline size-4" />{' '}
                                                    Tanggal mulai
                                                </Label>
                                                <Input
                                                    id="process-started"
                                                    name="started_at"
                                                    type="date"
                                                    defaultValue={todayString()}
                                                    required
                                                />
                                                <InputError message={errors.started_at} />
                                            </div>

                                            <div className="grid gap-2">
                                                <Label htmlFor="process-estimated">
                                                    Estimasi selesai
                                                </Label>
                                                <Input
                                                    id="process-estimated"
                                                    name="estimated_completion_date"
                                                    type="date"
                                                />
                                                <InputError
                                                    message={
                                                        errors.estimated_completion_date
                                                    }
                                                />
                                            </div>

                                            <div className="grid gap-2 sm:col-span-2">
                                                <Label htmlFor="process-notes">
                                                    Catatan awal
                                                </Label>
                                                <Textarea
                                                    id="process-notes"
                                                    name="notes"
                                                    rows={4}
                                                    placeholder="Tambahkan instruksi atau kondisi khusus proses berkas..."
                                                />
                                                <InputError message={errors.notes} />
                                            </div>
                                        </div>

                                        <div className="flex justify-end gap-2 border-t pt-5">
                                            <Button variant="outline" asChild>
                                                <Link href={documentProcessesIndex.url()}>
                                                    Batal
                                                </Link>
                                            </Button>
                                            <Button type="submit" disabled={processing}>
                                                {processing ? <Spinner /> : <FloppyDiskIcon />}
                                                Buat Proses Berkas
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </Form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

DocumentProcessesCreate.layout = {
    breadcrumbs: [
        { title: 'Proses Berkas', href: documentProcessesIndex.url() },
        { title: 'Mulai Proses', href: '#' },
    ],
};

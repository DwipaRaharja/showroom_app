import { Form } from '@inertiajs/react';
import { FloppyDiskIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import FinanceCompanyController from '@/actions/App/Http/Controllers/FinanceCompanyController';
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
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import type { FinanceCompany } from '@/pages/finance-companies/types';

type Props = {
    open: boolean;
    company: FinanceCompany | null;
    onOpenChange: (open: boolean) => void;
};

const validationColorClassName =
    'aria-invalid:border-red-500 aria-invalid:ring-red-500/20 dark:aria-invalid:ring-red-500/40';
const errorTextClassName = 'text-red-500 dark:text-red-500';

function FinanceCompanyFormContent({
    company,
    onOpenChange,
}: Omit<Props, 'open'>) {
    const [name, setName] = useState(company?.name ?? '');
    const [code, setCode] = useState(company?.code ?? '');
    const [picName, setPicName] = useState(company?.pic_name ?? '');
    const [picPhone, setPicPhone] = useState(company?.pic_phone ?? '');
    const [isActive, setIsActive] = useState(company?.is_active ?? true);
    const [notes, setNotes] = useState(company?.notes ?? '');
    const isEditing = company !== null;

    const formDefinition = isEditing
        ? FinanceCompanyController.update.form(company.id)
        : FinanceCompanyController.store.form();

    return (
        <DialogContent className="sm:max-w-xl">
            <DialogHeader>
                <DialogTitle>
                    {isEditing ? 'Edit Perusahaan Leasing' : 'Tambah Perusahaan Leasing'}
                </DialogTitle>
                <DialogDescription>
                    {isEditing
                        ? `Perbarui informasi rekanan leasing ${company.name}.`
                        : 'Masukkan informasi rekanan perusahaan pembiayaan / leasing baru.'}
                </DialogDescription>
            </DialogHeader>

            <Form
                {...formDefinition}
                options={{ preserveScroll: true }}
                onSuccess={() => onOpenChange(false)}
                className="space-y-4"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <div className="space-y-2 sm:col-span-2">
                                <Label htmlFor="name">
                                    Nama Perusahaan Leasing <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    name="name"
                                    placeholder="Contoh: BCA Finance, Mandiri Utama Finance"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    aria-invalid={errors.name ? 'true' : undefined}
                                    className={validationColorClassName}
                                    required
                                    autoFocus
                                />
                                <InputError message={errors.name} className={errorTextClassName} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="code">Kode Singkatan</Label>
                                <Input
                                    id="code"
                                    name="code"
                                    placeholder="Contoh: BCAF, MUF"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                                    aria-invalid={errors.code ? 'true' : undefined}
                                    className={validationColorClassName}
                                />
                                <InputError message={errors.code} className={errorTextClassName} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="pic_name">Nama PIC / Marketing</Label>
                                <Input
                                    id="pic_name"
                                    name="pic_name"
                                    placeholder="Contoh: Budi Santoso"
                                    value={picName}
                                    onChange={(e) => setPicName(e.target.value)}
                                    aria-invalid={errors.pic_name ? 'true' : undefined}
                                    className={validationColorClassName}
                                />
                                <InputError message={errors.pic_name} className={errorTextClassName} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="pic_phone">No. HP / WhatsApp PIC</Label>
                                <Input
                                    id="pic_phone"
                                    name="pic_phone"
                                    placeholder="Contoh: 081234567890"
                                    value={picPhone}
                                    onChange={(e) => setPicPhone(e.target.value)}
                                    aria-invalid={errors.pic_phone ? 'true' : undefined}
                                    className={validationColorClassName}
                                />
                                <InputError message={errors.pic_phone} className={errorTextClassName} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes">Catatan & Syarat Kerjasama</Label>
                            <Textarea
                                id="notes"
                                name="notes"
                                placeholder="Contoh: Program bunga promo 2026, DP minim, proses approval 1 hari..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                aria-invalid={errors.notes ? 'true' : undefined}
                                className={validationColorClassName}
                                rows={3}
                            />
                            <InputError message={errors.notes} className={errorTextClassName} />
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                            <Checkbox
                                id="is_active"
                                name="is_active"
                                checked={isActive}
                                onCheckedChange={(checked) => setIsActive(checked === true)}
                            />
                            <Label htmlFor="is_active" className="cursor-pointer font-normal">
                                Status Rekanan Aktif (dapat dipilih pada transaksi penjualan)
                            </Label>
                        </div>
                        <InputError message={errors.is_active} className={errorTextClassName} />

                        <DialogFooter className="pt-2">
                            <DialogClose asChild>
                                <Button type="button" variant="outline" disabled={processing}>
                                    Batal
                                </Button>
                            </DialogClose>
                            <Button type="submit" disabled={processing}>
                                {processing ? (
                                    <>
                                        <Spinner className="mr-1.5 size-4" />
                                        Menyimpan...
                                    </>
                                ) : (
                                    <>
                                        <FloppyDiskIcon className="mr-1.5 size-4" />
                                        {isEditing ? 'Perbarui Leasing' : 'Simpan Leasing'}
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </Form>
        </DialogContent>
    );
}

export function FinanceCompanyFormDialog({
    open,
    company,
    onOpenChange,
}: Props) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {open && (
                <FinanceCompanyFormContent
                    company={company}
                    onOpenChange={onOpenChange}
                />
            )}
        </Dialog>
    );
}

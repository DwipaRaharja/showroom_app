import { Form } from '@inertiajs/react';
import { FloppyDiskIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import CustomerController from '@/actions/App/Http/Controllers/CustomerController';
import InputError from '@/components/input-error';
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
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import type { Customer } from '@/pages/customers/types';

type Props = {
    open: boolean;
    customer: Customer | null;
    onOpenChange: (open: boolean) => void;
};

const validationColorClassName =
    'aria-invalid:border-red-500 aria-invalid:ring-red-500/20 dark:aria-invalid:ring-red-500/40';
const errorTextClassName = 'text-red-500 dark:text-red-500';

function CustomerFormContent({ customer, onOpenChange }: Omit<Props, 'open'>) {
    const [name, setName] = useState(customer?.name ?? '');
    const [phone, setPhone] = useState(customer?.phone ?? '');
    const [ktpNumber, setKtpNumber] = useState(customer?.ktp_number ?? '');
    const [address, setAddress] = useState(customer?.address ?? '');
    const isEditing = customer !== null;

    const formDefinition = isEditing
        ? CustomerController.update.form(customer.id)
        : CustomerController.store.form();

    return (
        <DialogContent className="sm:max-w-xl">
            <DialogHeader>
                <DialogTitle>
                    {isEditing ? 'Edit customer' : 'Tambah customer'}
                </DialogTitle>
                <DialogDescription>
                    {isEditing
                        ? `Perbarui informasi customer ${customer.name}.`
                        : 'Masukkan informasi customer baru showroom.'}
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
                        <div className="grid gap-2">
                            <Label htmlFor="customer-name">
                                Nama lengkap{' '}
                                <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="customer-name"
                                name="name"
                                value={name}
                                onChange={(event) =>
                                    setName(event.target.value)
                                }
                                placeholder="Contoh: Budi Santoso"
                                autoComplete="off"
                                maxLength={100}
                                required
                                autoFocus
                                aria-invalid={Boolean(errors.name)}
                                className={validationColorClassName}
                            />
                            <InputError
                                message={errors.name}
                                className={errorTextClassName}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="customer-phone">
                                Nomor telepon / WhatsApp
                            </Label>
                            <Input
                                id="customer-phone"
                                name="phone"
                                type="tel"
                                value={phone}
                                onChange={(event) =>
                                    setPhone(event.target.value)
                                }
                                placeholder="Contoh: 081234567890"
                                autoComplete="tel"
                                inputMode="tel"
                                maxLength={20}
                                aria-invalid={Boolean(errors.phone)}
                                className={validationColorClassName}
                            />
                            <InputError
                                message={errors.phone}
                                className={errorTextClassName}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="customer-ktp">
                                Nomor KTP / NIK
                            </Label>
                            <Input
                                id="customer-ktp"
                                name="ktp_number"
                                value={ktpNumber}
                                onChange={(event) =>
                                    setKtpNumber(event.target.value)
                                }
                                placeholder="Contoh: 3201234567890001"
                                autoComplete="off"
                                inputMode="numeric"
                                maxLength={16}
                                aria-invalid={Boolean(errors.ktp_number)}
                                className={validationColorClassName}
                            />
                            <InputError
                                message={errors.ktp_number}
                                className={errorTextClassName}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="customer-address">
                                Alamat lengkap
                            </Label>
                            <Textarea
                                id="customer-address"
                                name="address"
                                value={address}
                                onChange={(event) =>
                                    setAddress(event.target.value)
                                }
                                placeholder="Contoh: Jl. Sudirman No. 123, Jakarta"
                                autoComplete="street-address"
                                maxLength={500}
                                rows={3}
                                aria-invalid={Boolean(errors.address)}
                                className={validationColorClassName}
                            />
                            <InputError
                                message={errors.address}
                                className={errorTextClassName}
                            />
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
                                {isEditing
                                    ? 'Simpan perubahan'
                                    : 'Tambah customer'}
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </Form>
        </DialogContent>
    );
}

export function CustomerFormDialog({ open, customer, onOpenChange }: Props) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {open && (
                <CustomerFormContent
                    customer={customer}
                    onOpenChange={onOpenChange}
                />
            )}
        </Dialog>
    );
}

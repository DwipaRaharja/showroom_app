import { Form } from '@inertiajs/react';
import { FloppyDiskIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import BrandController from '@/actions/App/Http/Controllers/BrandController';
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
import type { Brand } from '@/pages/brands/types';

type Props = {
    open: boolean;
    brand: Brand | null;
    onOpenChange: (open: boolean) => void;
};

const validationColorClassName =
    'aria-invalid:border-red-500 aria-invalid:ring-red-500/20 dark:aria-invalid:ring-red-500/40';
const errorTextClassName = 'text-red-500 dark:text-red-500';

function BrandFormContent({ brand, onOpenChange }: Omit<Props, 'open'>) {
    const [name, setName] = useState(brand?.name ?? '');
    const [isActive, setIsActive] = useState(brand?.is_active ?? true);
    const isEditing = brand !== null;

    const formDefinition = isEditing
        ? BrandController.update.form(brand.id)
        : BrandController.store.form();

    return (
        <DialogContent className="sm:max-w-xl">
            <DialogHeader>
                <DialogTitle>
                    {isEditing ? 'Edit merek' : 'Tambah merek'}
                </DialogTitle>
                <DialogDescription>
                    {isEditing
                        ? `Perbarui informasi merek ${brand.name}.`
                        : 'Masukkan informasi merek kendaraan baru.'}
                </DialogDescription>
            </DialogHeader>

            <Form
                {...formDefinition}
                options={{ preserveScroll: true }}
                onSuccess={() => onOpenChange(false)}
                className="space-y-5"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-2">
                            <Label htmlFor="brand-name">Nama merek</Label>
                            <Input
                                id="brand-name"
                                name="name"
                                value={name}
                                onChange={(event) =>
                                    setName(event.target.value)
                                }
                                placeholder="Contoh: Mercedes-Benz"
                                autoComplete="off"
                                maxLength={100}
                                required
                                autoFocus
                                aria-invalid={Boolean(
                                    errors.name || errors.slug,
                                )}
                                className={validationColorClassName}
                            />
                            <InputError
                                message={errors.name ?? errors.slug}
                                className={errorTextClassName}
                            />
                        </div>

                        <input
                            type="hidden"
                            name="is_active"
                            value={isActive ? '1' : '0'}
                        />
                        <div className="flex items-start gap-3 rounded-lg border p-4">
                            <Checkbox
                                id="brand-is-active"
                                checked={isActive}
                                onCheckedChange={(checked) =>
                                    setIsActive(checked === true)
                                }
                                aria-invalid={Boolean(errors.is_active)}
                                className={validationColorClassName}
                            />
                            <div className="grid gap-1">
                                <Label htmlFor="brand-is-active">
                                    Merek aktif
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    Merek aktif dapat digunakan pada data
                                    kendaraan baru.
                                </p>
                                <InputError
                                    message={errors.is_active}
                                    className={errorTextClassName}
                                />
                            </div>
                        </div>

                        <DialogFooter>
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
                                    : 'Tambah merek'}
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </Form>
        </DialogContent>
    );
}

export function BrandFormDialog({ open, brand, onOpenChange }: Props) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {open && (
                <BrandFormContent brand={brand} onOpenChange={onOpenChange} />
            )}
        </Dialog>
    );
}

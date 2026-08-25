import { Form } from '@inertiajs/react';
import { FloppyDiskIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import DocumentProcessController from '@/actions/App/Http/Controllers/DocumentProcessController';
import InputError from '@/components/input-error';
import { PriceInput } from '@/components/price-input';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import type { DocumentProcess } from '@/pages/document-processes/types';

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    process: DocumentProcess;
};

function today(): string {
    const date = new Date();
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);

    return local.toISOString().slice(0, 10);
}

export function ProcessCostDialog({ open, onOpenChange, process }: Props) {
    const [paidBy, setPaidBy] = useState('showroom');
    const [amount, setAmount] = useState('');

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Tambah Biaya Proses</DialogTitle>
                    <DialogDescription>
                        Biaya showroom otomatis menambah modal kendaraan. Biaya
                        customer hanya dicatat sebagai riwayat proses.
                    </DialogDescription>
                </DialogHeader>

                <Form
                    action={DocumentProcessController.storeCost.url(process.id)}
                    method="post"
                    onSuccess={() => onOpenChange(false)}
                    className="grid gap-4"
                >
                    {({ processing, errors }) => (
                        <>
                            <input
                                type="hidden"
                                name="paid_by"
                                value={paidBy}
                            />

                            <div className="grid gap-1.5">
                                <Label htmlFor="cost-description">
                                    Keterangan biaya
                                </Label>
                                <Input
                                    id="cost-description"
                                    name="description"
                                    placeholder="Contoh: Pembayaran pajak dan denda"
                                />
                                <InputError message={errors.description} />
                            </div>

                            <div className="grid gap-1.5">
                                <Label>Jumlah biaya</Label>
                                <PriceInput
                                    name="amount"
                                    value={amount}
                                    onValueChange={setAmount}
                                    placeholder="Contoh: 1.500.000"
                                />
                                <InputError message={errors.amount} />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="grid gap-1.5">
                                    <Label>Dibayar oleh</Label>
                                    <Select
                                        value={paidBy}
                                        onValueChange={setPaidBy}
                                    >
                                        <SelectTrigger>
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
                                </div>
                                <div className="grid gap-1.5">
                                    <Label htmlFor="cost-paid-at">
                                        Tanggal bayar
                                    </Label>
                                    <Input
                                        id="cost-paid-at"
                                        name="paid_at"
                                        type="date"
                                        max={today()}
                                        defaultValue={today()}
                                    />
                                    <InputError message={errors.paid_at} />
                                </div>
                            </div>

                            <div className="grid gap-1.5">
                                <Label htmlFor="cost-receipt">
                                    Bukti pembayaran
                                </Label>
                                <Input
                                    id="cost-receipt"
                                    name="receipt"
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                                />
                                <p className="text-xs text-muted-foreground">
                                    PDF atau gambar, maksimal 5 MB.
                                </p>
                                <InputError message={errors.receipt} />
                            </div>

                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button type="button" variant="outline">
                                        Batal
                                    </Button>
                                </DialogClose>
                                <Button
                                    type="submit"
                                    disabled={processing || amount === ''}
                                >
                                    {processing ? (
                                        <Spinner />
                                    ) : (
                                        <FloppyDiskIcon />
                                    )}
                                    Simpan biaya
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}

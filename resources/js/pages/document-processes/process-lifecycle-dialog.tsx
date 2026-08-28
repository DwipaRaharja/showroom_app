import { Form } from '@inertiajs/react';
import { ProhibitIcon, TrashIcon, WarningIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import DocumentProcessController from '@/actions/App/Http/Controllers/DocumentProcessController';
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
import type { DocumentProcess } from '@/pages/document-processes/types';

export type ProcessLifecycleAction = 'cancel' | 'delete';

type Props = {
    process: DocumentProcess | null;
    action: ProcessLifecycleAction;
    onOpenChange: (open: boolean) => void;
};

export function ProcessLifecycleDialog({
    process,
    action,
    onOpenChange,
}: Props) {
    const [reason, setReason] = useState('');
    const [confirmation, setConfirmation] = useState('');
    const isDelete = action === 'delete';

    function handleOpenChange(open: boolean) {
        if (!open) {
            setReason('');
            setConfirmation('');
        }

        onOpenChange(open);
    }

    return (
        <Dialog open={process !== null} onOpenChange={handleOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <div className="mb-1 flex size-10 items-center justify-center rounded-full bg-red-500/10 text-red-500">
                        <WarningIcon className="size-5" weight="fill" />
                    </div>
                    <DialogTitle>
                        {isDelete
                            ? 'Hapus Permanen Proses Berkas?'
                            : 'Batalkan Proses Berkas?'}
                    </DialogTitle>
                    <DialogDescription>
                        {isDelete ? (
                            <>
                                Proses{' '}
                                <strong>{process?.process_number}</strong>{' '}
                                beserta item dokumen, biaya, tracking, dan file
                                akan dihapus. Tindakan ini tidak dapat
                                dibatalkan.
                            </>
                        ) : (
                            <>
                                Riwayat proses{' '}
                                <strong>{process?.process_number}</strong> tetap
                                tersimpan. Dokumen yang sedang dipegang akan
                                ditandai dikembalikan dan biayanya dikeluarkan
                                dari modal kendaraan.
                            </>
                        )}
                    </DialogDescription>
                </DialogHeader>

                {process && (
                    <Form
                        key={`${action}-${process.id}`}
                        action={
                            isDelete
                                ? DocumentProcessController.destroy.url(
                                      process.id,
                                  )
                                : DocumentProcessController.cancel.url(
                                      process.id,
                                  )
                        }
                        method={isDelete ? 'delete' : 'patch'}
                        options={{ preserveScroll: true }}
                        onSuccess={() => handleOpenChange(false)}
                        className="grid gap-4"
                    >
                        {({ processing, errors }) => (
                            <>
                                <div className="grid gap-1.5">
                                    <div className="flex items-center justify-between gap-3">
                                        <Label htmlFor="process-action-reason">
                                            {isDelete
                                                ? 'Alasan penghapusan'
                                                : 'Alasan pembatalan'}{' '}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </Label>
                                        {!isDelete && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="h-7"
                                                onClick={() =>
                                                    setReason('Tidak jadi')
                                                }
                                                disabled={processing}
                                            >
                                                Tidak jadi
                                            </Button>
                                        )}
                                    </div>
                                    <Textarea
                                        id="process-action-reason"
                                        name="reason"
                                        rows={3}
                                        value={reason}
                                        onChange={(event) =>
                                            setReason(event.target.value)
                                        }
                                        aria-invalid={Boolean(errors.reason)}
                                        placeholder={
                                            isDelete
                                                ? 'Contoh: Data proses dibuat dua kali'
                                                : 'Contoh: Customer tidak jadi melanjutkan pengurusan'
                                        }
                                    />
                                    <InputError message={errors.reason} />
                                </div>

                                {isDelete && (
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="process-number-confirmation">
                                            Ketik{' '}
                                            <span className="font-mono font-semibold">
                                                {process.process_number}
                                            </span>{' '}
                                            untuk konfirmasi{' '}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </Label>
                                        <Input
                                            id="process-number-confirmation"
                                            name="process_number"
                                            value={confirmation}
                                            onChange={(event) =>
                                                setConfirmation(
                                                    event.target.value,
                                                )
                                            }
                                            aria-invalid={Boolean(
                                                errors.process_number,
                                            )}
                                            placeholder={`Ketik ${process.process_number}`}
                                            autoComplete="off"
                                        />
                                        <InputError
                                            message={errors.process_number}
                                        />
                                    </div>
                                )}

                                <DialogFooter>
                                    <DialogClose asChild>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            disabled={processing}
                                        >
                                            Kembali
                                        </Button>
                                    </DialogClose>
                                    <Button
                                        type="submit"
                                        variant="destructive"
                                        className="bg-red-500 text-white hover:bg-red-500/90 dark:bg-red-500 dark:text-white dark:hover:bg-red-500/90"
                                        disabled={
                                            processing ||
                                            (isDelete &&
                                                confirmation !==
                                                    process.process_number)
                                        }
                                    >
                                        {processing ? (
                                            <Spinner />
                                        ) : isDelete ? (
                                            <TrashIcon weight="bold" />
                                        ) : (
                                            <ProhibitIcon weight="bold" />
                                        )}
                                        {processing
                                            ? 'Memproses...'
                                            : isDelete
                                              ? 'Hapus Permanen'
                                              : 'Batalkan Proses'}
                                    </Button>
                                </DialogFooter>
                            </>
                        )}
                    </Form>
                )}
            </DialogContent>
        </Dialog>
    );
}

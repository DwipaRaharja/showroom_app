import { Head, router } from '@inertiajs/react';
import {
    DatabaseIcon,
    DownloadSimpleIcon,
    FileArchiveIcon,
    PlusIcon,
    TrashIcon,
} from '@phosphor-icons/react';
import { useState } from 'react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/confirm-dialog';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import { formatDateTime } from '@/lib/formatters';
import { destroy, index as backupIndex, store } from '@/routes/backup';

interface BackupFile {
    name: string;
    size: number;
    date: number;
}

export default function Backup({ backups }: { backups: BackupFile[] }) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [fileToDelete, setFileToDelete] = useState<string | null>(null);
    const [prevFile, setPrevFile] = useState<string | null>(fileToDelete);
    const [cachedFile, setCachedFile] = useState<string | null>(fileToDelete);

    if (fileToDelete !== prevFile) {
        setPrevFile(fileToDelete);

        if (fileToDelete !== null) {
            setCachedFile(fileToDelete);
        }
    }

    const activeFile = fileToDelete ?? cachedFile;

    const handleBackup = () => {
        setIsProcessing(true);
        router.post(
            store.url(),
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Backup database berhasil dibuat.');
                    setIsProcessing(false);
                },
                onError: (errors: Record<string, string>) => {
                    toast.error(
                        errors.backup || 'Gagal membuat backup database.',
                    );
                    setIsProcessing(false);
                },
                onFinish: () => setIsProcessing(false),
            },
        );
    };

    const handleDelete = () => {
        if (!fileToDelete) {
            return;
        }

        router.delete(destroy.url({ file_name: fileToDelete }), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('File backup berhasil dihapus.');
                setFileToDelete(null);
            },
            onError: () => {
                toast.error('Gagal menghapus file backup.');
                setFileToDelete(null);
            },
        });
    };

    const formatBytes = (bytes: number, decimals = 2) => {
        if (!+bytes) {
            return '0 Bytes';
        }

        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    };

    return (
        <>
            <Head title="Pengaturan Backup Data" />

            <h1 className="sr-only">Pengaturan Backup Data</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Backup Data"
                    description="Buat dan unduh cadangan database showroom untuk keamanan dan pemulihan data Anda"
                />

                <div className="flex items-center gap-3">
                    <Button onClick={handleBackup} disabled={isProcessing}>
                        {isProcessing ? (
                            <>
                                <Spinner className="mr-1.5 size-4" />
                                Memproses Backup...
                            </>
                        ) : (
                            <>
                                <PlusIcon className="mr-1.5 size-4" />
                                Buat Backup Sekarang
                            </>
                        )}
                    </Button>
                </div>

                <Separator />

                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <DatabaseIcon
                                className="size-4 text-primary"
                                weight="fill"
                            />
                            <h3 className="text-sm font-semibold text-foreground">
                                Riwayat Cadangan
                            </h3>
                        </div>
                        <Badge variant="outline" className="font-mono text-xs">
                            {backups.length} File
                        </Badge>
                    </div>

                    {backups.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
                            <div className="mb-2.5 flex size-9 items-center justify-center rounded-full bg-muted text-muted-foreground">
                                <DatabaseIcon className="size-4.5" />
                            </div>
                            <p className="text-sm font-medium text-foreground">
                                Belum ada file backup
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                Tekan tombol "Buat Backup Sekarang" di atas
                                untuk mencadangkan database.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {backups.map((file) => (
                                <div
                                    key={file.name}
                                    className="flex items-center justify-between gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-muted/30"
                                >
                                    <div className="flex min-w-0 items-center gap-3">
                                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                            <FileArchiveIcon
                                                className="size-5"
                                                weight="fill"
                                            />
                                        </div>
                                        <div className="min-w-0 space-y-0.5">
                                            <p
                                                className="truncate font-mono text-xs font-semibold text-foreground"
                                                title={file.name}
                                            >
                                                {file.name}
                                            </p>
                                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                                                <span>
                                                    {formatBytes(file.size)}
                                                </span>
                                                <span>•</span>
                                                <span>
                                                    {formatDateTime(
                                                        file.date * 1000,
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex shrink-0 items-center gap-1">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 px-2.5 text-xs"
                                            asChild
                                        >
                                            <a
                                                href={`/settings/backup/${file.name}/download`}
                                                download
                                            >
                                                <DownloadSimpleIcon className="mr-1 size-3.5" />
                                                Unduh
                                            </a>
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="size-8 text-muted-foreground hover:bg-red-500/10 hover:text-red-500 dark:hover:text-red-400"
                                            onClick={() =>
                                                setFileToDelete(file.name)
                                            }
                                            aria-label={`Hapus file ${file.name}`}
                                        >
                                            <TrashIcon className="size-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <ConfirmDialog
                open={fileToDelete !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setFileToDelete(null);
                    }
                }}
                tone="danger"
                title="Hapus File Backup?"
                description={
                    <>
                        Apakah Anda yakin ingin menghapus file backup{' '}
                        <strong>{activeFile}</strong>? Tindakan ini tidak dapat
                        dibatalkan.
                    </>
                }
                confirmText="Hapus Permanen"
                cancelText="Batal"
                onConfirm={handleDelete}
            />
        </>
    );
}

Backup.layout = {
    breadcrumbs: [
        {
            title: 'Backup Data',
            href: backupIndex(),
        },
    ],
};

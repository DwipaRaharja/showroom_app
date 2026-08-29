import { Head, router } from '@inertiajs/react';
import { DatabaseBackup, Download, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/confirm-dialog';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
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

    const formatDate = (timestamp: number) => {
        return new Date(timestamp * 1000).toLocaleString('id-ID', {
            dateStyle: 'medium',
            timeStyle: 'short',
        });
    };

    return (
        <>
            <Head title="Backup Data" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <Heading
                        variant="small"
                        title="Backup Data"
                        description="Kelola dan buat cadangan database aplikasi Anda"
                    />

                    <Button
                        onClick={handleBackup}
                        disabled={isProcessing}
                        className="gap-2"
                    >
                        <DatabaseBackup className="h-4 w-4" />
                        {isProcessing ? 'Memproses...' : 'Buat Backup Baru'}
                    </Button>
                </div>

                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nama File</TableHead>
                                <TableHead>Ukuran</TableHead>
                                <TableHead>Waktu Dibuat</TableHead>
                                <TableHead className="text-right">
                                    Aksi
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {backups.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={4}
                                        className="h-24 text-center text-muted-foreground"
                                    >
                                        Belum ada file backup.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                backups.map((file) => (
                                    <TableRow key={file.name}>
                                        <TableCell className="font-medium">
                                            {file.name}
                                        </TableCell>
                                        <TableCell>
                                            {formatBytes(file.size)}
                                        </TableCell>
                                        <TableCell>
                                            {formatDate(file.date)}
                                        </TableCell>
                                        <TableCell className="space-x-2 text-right">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                asChild
                                            >
                                                <a
                                                    href={`/settings/backup/${file.name}/download`}
                                                    download
                                                >
                                                    <Download className="mr-2 h-4 w-4" />
                                                    Unduh
                                                </a>
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() =>
                                                    setFileToDelete(file.name)
                                                }
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Hapus
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
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

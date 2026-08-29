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
import { CardSectionHeader } from '@/components/card-section-header';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { DataTableEmptyState } from '@/components/data-table/data-table-empty-state';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
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
                    description="Kelola dan buat cadangan database aplikasi showroom untuk keamanan data Anda"
                />

                <Card>
                    <CardSectionHeader
                        icon={<DatabaseIcon className="size-4" weight="fill" />}
                        title="Cadangan Database"
                        description="Daftar file cadangan (.zip) yang tersimpan di server"
                        badge={
                            <Badge
                                variant="outline"
                                className="font-mono text-xs"
                            >
                                {backups.length} File
                            </Badge>
                        }
                        action={
                            <Button
                                onClick={handleBackup}
                                disabled={isProcessing}
                                size="sm"
                            >
                                {isProcessing ? (
                                    <>
                                        <Spinner className="mr-1.5 size-4" />
                                        Memproses...
                                    </>
                                ) : (
                                    <>
                                        <PlusIcon className="mr-1.5 size-4" />
                                        Buat Backup Baru
                                    </>
                                )}
                            </Button>
                        }
                    />
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-muted/40">
                                <TableRow>
                                    <TableHead className="w-12 text-center">
                                        No.
                                    </TableHead>
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
                                    <DataTableEmptyState
                                        colSpan={5}
                                        title="Belum ada file backup"
                                        description="Klik tombol 'Buat Backup Baru' di atas untuk membuat cadangan database."
                                    />
                                ) : (
                                    backups.map((file, index) => (
                                        <TableRow key={file.name}>
                                            <TableCell className="text-center text-xs text-muted-foreground">
                                                {index + 1}
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    <FileArchiveIcon
                                                        className="size-4 shrink-0 text-primary"
                                                        weight="fill"
                                                    />
                                                    <span
                                                        className="max-w-44 truncate font-mono text-xs sm:max-w-xs"
                                                        title={file.name}
                                                    >
                                                        {file.name}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="secondary"
                                                    className="font-mono text-[11px]"
                                                >
                                                    {formatBytes(file.size)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
                                                {formatDateTime(
                                                    file.date * 1000,
                                                )}
                                            </TableCell>
                                            <TableCell className="space-x-1.5 text-right whitespace-nowrap">
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
                                                    size="sm"
                                                    className="h-8 px-2.5 text-xs text-red-500 hover:bg-red-500/10 hover:text-red-600 dark:text-red-400"
                                                    onClick={() =>
                                                        setFileToDelete(
                                                            file.name,
                                                        )
                                                    }
                                                >
                                                    <TrashIcon className="mr-1 size-3.5" />
                                                    Hapus
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
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

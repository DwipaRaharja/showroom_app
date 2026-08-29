import { Head, router } from '@inertiajs/react';
import { Download, Trash2, DatabaseBackup } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
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
import { index as backupIndex, store, destroy } from '@/routes/backup';

interface BackupFile {
    name: string;
    size: number;
    date: number;
}

export default function Backup({ backups }: { backups: BackupFile[] }) {
    const [isProcessing, setIsProcessing] = useState(false);

    const handleBackup = () => {
        setIsProcessing(true);
        router.post(
            store(),
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Backup berhasil dibuat.');
                    setIsProcessing(false);
                },
                onError: (errors: any) => {
                    toast.error(errors.backup || 'Gagal membuat backup.');
                    setIsProcessing(false);
                },
                onFinish: () => setIsProcessing(false),
            },
        );
    };

    const handleDownload = (name: string) => {
        window.location.href = `/settings/backup/${name}/download`;
    };

    const handleDelete = (name: string) => {
        if (confirm('Apakah Anda yakin ingin menghapus backup ini?')) {
            router.post(
                destroy({ file_name: name }),
                {},
                {
                    preserveScroll: true,
                    onSuccess: () =>
                        toast.success('File backup berhasil dihapus.'),
                },
            );
        }
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
                                                onClick={() =>
                                                    handleDownload(file.name)
                                                }
                                            >
                                                <Download className="mr-2 h-4 w-4" />
                                                Unduh
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() =>
                                                    handleDelete(file.name)
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

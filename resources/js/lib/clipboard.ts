import { toast } from 'sonner';

/**
 * Menyalin teks ke clipboard dan menampilkan notifikasi toast.
 *
 * @param value Teks yang akan disalin
 * @param label Nama label untuk pesan notifikasi (misal: "Nomor plat", "NIK")
 */
export async function copyToClipboard(
    value: string,
    label: string = 'Teks',
): Promise<boolean> {
    if (!value) {
        toast.error(`Tidak ada ${label.toLowerCase()} untuk disalin.`);
        return false;
    }

    try {
        await navigator.clipboard.writeText(value);
        toast.success(`${label} berhasil disalin.`);
        return true;
    } catch {
        toast.error(`${label} gagal disalin.`);
        return false;
    }
}

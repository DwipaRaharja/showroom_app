import {
    CalendarBlankIcon,
    CopyIcon,
    IdentificationCardIcon,
    MapPinIcon,
    PencilSimpleIcon,
    PhoneIcon,
    UserIcon,
    WhatsappLogoIcon,
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
} from '@/components/ui/dialog';
import type { Customer } from '@/pages/customers/types';

type Props = {
    customer: Customer | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onEdit?: (customer: Customer) => void;
};

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
});

async function copyText(value: string, label: string) {
    try {
        await navigator.clipboard.writeText(value);
        toast.success(`${label} berhasil disalin.`);
    } catch {
        toast.error(`${label} gagal disalin.`);
    }
}

export function CustomerDetailDialog({
    customer,
    open,
    onOpenChange,
    onEdit,
}: Props) {
    if (!customer) {
        return null;
    }

    const isArchived = customer.deleted_at !== null;
    const cleanPhone = customer.phone?.replace(/[^0-9]/g, '') ?? '';
    const whatsappUrl = cleanPhone
        ? `https://wa.me/${cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone}`
        : null;

    // Get initials for avatar
    const initials = customer.name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((n) => n[0])
        .join('')
        .toUpperCase();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-lg">
                {/* Header Banner */}
                <div className="border-b bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 pr-14">
                    <div className="flex items-center gap-3.5">
                        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary text-base font-semibold text-primary-foreground shadow-sm">
                            {initials || <UserIcon className="size-6" />}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <DialogTitle className="text-xl font-bold tracking-tight">
                                    {customer.name}
                                </DialogTitle>
                                <StatusBadge
                                    status={isArchived ? 'archived' : 'active'}
                                    className="px-2 py-0.5 text-xs shadow-xs"
                                />
                            </div>
                            <DialogDescription className="mt-0.5 text-xs text-muted-foreground">
                                ID Customer:{' '}
                                <span className="font-mono font-medium">
                                    #{customer.id}
                                </span>
                            </DialogDescription>
                        </div>
                    </div>
                </div>

                {/* Content Cards */}
                <div className="space-y-4 p-6 text-sm">
                    {/* Contact & WA */}
                    <div className="rounded-xl border bg-card p-3.5 shadow-xs transition-colors hover:bg-accent/20">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5 rounded-lg bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-500">
                                    <PhoneIcon
                                        className="size-4"
                                        weight="bold"
                                    />
                                </div>
                                <div>
                                    <div className="text-xs font-medium text-muted-foreground">
                                        Telepon / WhatsApp
                                    </div>
                                    <div className="mt-0.5 font-mono text-base font-semibold text-foreground">
                                        {customer.phone || (
                                            <span className="font-sans text-sm font-normal text-muted-foreground">
                                                Belum diisi
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            {customer.phone && (
                                <div className="flex items-center gap-1.5">
                                    {whatsappUrl && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 gap-1.5 border-emerald-200 text-xs text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:border-emerald-800 dark:hover:bg-emerald-950/40"
                                            asChild
                                        >
                                            <a
                                                href={whatsappUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                <WhatsappLogoIcon
                                                    className="size-4"
                                                    weight="fill"
                                                />
                                                Chat WA
                                            </a>
                                        </Button>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="size-8"
                                        onClick={() =>
                                            void copyText(
                                                customer.phone ?? '',
                                                'Nomor telepon',
                                            )
                                        }
                                        title="Salin No. HP"
                                    >
                                        <CopyIcon className="size-4" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* KTP / NIK */}
                    <div className="rounded-xl border bg-card p-3.5 shadow-xs transition-colors hover:bg-accent/20">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5 rounded-lg bg-blue-500/10 p-2 text-blue-600 dark:text-blue-500">
                                    <IdentificationCardIcon
                                        className="size-4"
                                        weight="bold"
                                    />
                                </div>
                                <div>
                                    <div className="text-xs font-medium text-muted-foreground">
                                        Nomor KTP / NIK
                                    </div>
                                    <div className="mt-0.5 font-mono text-sm font-semibold text-foreground">
                                        {customer.ktp_number || (
                                            <span className="font-sans text-sm font-normal text-muted-foreground">
                                                Belum diisi
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            {customer.ktp_number && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-8"
                                    onClick={() =>
                                        void copyText(
                                            customer.ktp_number ?? '',
                                            'NIK',
                                        )
                                    }
                                    title="Salin NIK"
                                >
                                    <CopyIcon className="size-4" />
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Address */}
                    <div className="rounded-xl border bg-card p-3.5 shadow-xs transition-colors hover:bg-accent/20">
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5 shrink-0 rounded-lg bg-amber-500/10 p-2 text-amber-600 dark:text-amber-500">
                                <MapPinIcon className="size-4" weight="bold" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="text-xs font-medium text-muted-foreground">
                                    Alamat Lengkap
                                </div>
                                <div className="mt-0.5 text-sm leading-relaxed font-medium text-foreground">
                                    {customer.address || (
                                        <span className="font-normal text-muted-foreground">
                                            Belum diisi
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Registration Date Banner */}
                    <div className="flex items-center gap-2 px-1 text-xs text-muted-foreground">
                        <CalendarBlankIcon className="size-4" />
                        <span>
                            Terdaftar sejak{' '}
                            <strong className="font-medium text-foreground">
                                {dateFormatter.format(
                                    new Date(customer.created_at),
                                )}
                            </strong>
                        </span>
                    </div>
                </div>

                {/* Footer Actions */}
                <DialogFooter className="gap-2 border-t bg-muted/30 p-4 sm:gap-2">
                    {!isArchived && onEdit && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                onOpenChange(false);
                                onEdit(customer);
                            }}
                            className="gap-1.5"
                        >
                            <PencilSimpleIcon className="size-4" />
                            Edit data customer
                        </Button>
                    )}
                    <DialogClose asChild>
                        <Button type="button" className="min-w-20">
                            Tutup
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

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
import { DetailItem } from '@/components/detail-item';
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
import { copyToClipboard } from '@/lib/clipboard';
import { formatDateTime } from '@/lib/formatters';
import type { Customer } from '@/pages/customers/types';

type Props = {
    customer: Customer | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onEdit?: (customer: Customer) => void;
};

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
                    <DetailItem
                        variant="card"
                        label="Telepon / WhatsApp"
                        value={customer.phone}
                        mono
                        icon={PhoneIcon}
                        copyable={customer.phone ?? false}
                        copyLabel="Nomor telepon"
                        action={
                            whatsappUrl && (
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
                            )
                        }
                    />

                    {/* KTP / NIK */}
                    <DetailItem
                        variant="card"
                        label="Nomor KTP / NIK"
                        value={customer.ktp_number}
                        mono
                        icon={IdentificationCardIcon}
                        copyable={customer.ktp_number ?? false}
                        copyLabel="NIK"
                    />

                    {/* Address */}
                    <DetailItem
                        variant="card"
                        label="Alamat Lengkap"
                        value={customer.address}
                        icon={MapPinIcon}
                    />

                    {/* Registration Date Banner */}
                    <div className="flex items-center gap-2 px-1 text-xs text-muted-foreground">
                        <CalendarBlankIcon className="size-4" />
                        <span>
                            Terdaftar sejak{' '}
                            <strong className="font-medium text-foreground">
                                {formatDateTime(customer.created_at, {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
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

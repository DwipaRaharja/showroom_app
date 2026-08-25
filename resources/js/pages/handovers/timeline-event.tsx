import { CalendarBlankIcon, MapPinIcon, UserIcon } from '@phosphor-icons/react';
import { Badge } from '@/components/ui/badge';
import { HandoverPhotoPreview } from '@/pages/handovers/photo-preview';
import type {
    RecipientRelation,
    VehicleHandoverEvent,
} from '@/pages/sales/types';

const relationLabels: Record<RecipientRelation, string> = {
    buyer_self: 'Pembeli sendiri',
    family: 'Keluarga pembeli',
    driver: 'Sopir / perwakilan',
    leasing_officer: 'Petugas leasing',
    other: 'Pihak lainnya',
};

const dateTimeFormatter = new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
});

export function TimelineEvent({ event }: { event: VehicleHandoverEvent }) {
    return (
        <article className="relative border-l-2 border-primary/20 pl-5 last:pb-0">
            <span className="absolute top-1 -left-1.75 size-3 rounded-full border-2 border-background bg-primary" />
            <div className="rounded-xl border bg-background p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2 font-semibold">
                            <CalendarBlankIcon className="size-4 text-primary" />
                            {dateTimeFormatter.format(
                                new Date(event.occurred_at),
                            )}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                            Dicatat oleh {event.officer_name}
                        </div>
                    </div>
                    <Badge variant="outline">
                        {event.event_type === 'vehicle_delivery'
                            ? 'Penyerahan unit'
                            : event.event_type === 'document_delivery'
                              ? 'Penyerahan dokumen'
                              : 'Penyerahan barang'}
                    </Badge>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                    {event.items.map((item) => (
                        <Badge key={item.id} variant="secondary">
                            {item.item_name}
                            {item.quantity > 1 ? ` (${item.quantity})` : ''}
                        </Badge>
                    ))}
                </div>

                <div className="mt-4 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                    <div className="flex items-start gap-2">
                        <UserIcon className="mt-0.5 size-3.5 shrink-0" />
                        <span>
                            Diterima oleh{' '}
                            <strong className="text-foreground">
                                {event.recipient_name}
                            </strong>{' '}
                            ({relationLabels[event.recipient_relation]})
                        </span>
                    </div>
                    <div className="flex items-start gap-2">
                        <MapPinIcon className="mt-0.5 size-3.5 shrink-0" />
                        <span>
                            {event.handover_location}
                            {event.handover_address
                                ? `, ${event.handover_address}`
                                : ''}
                        </span>
                    </div>
                </div>

                {event.vehicle_condition && (
                    <div className="mt-3 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                        Kondisi unit: bahan bakar{' '}
                        {event.vehicle_condition.fuel_level ?? '—'} ·{' '}
                        {event.vehicle_condition.cleanliness ?? '—'}
                    </div>
                )}

                {event.notes && (
                    <p className="mt-3 text-sm text-muted-foreground">
                        {event.notes}
                    </p>
                )}

                {event.photos.length > 0 && (
                    <div className="mt-3">
                        <HandoverPhotoPreview photos={event.photos} />
                    </div>
                )}
            </div>
        </article>
    );
}

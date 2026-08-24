<?php

declare(strict_types=1);

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class VehicleHandover extends Model
{
    protected $fillable = [
        'handover_number',
        'sale_id',
        'car_id',
        'status',
        'notes',
    ];

    protected $appends = [
        'vehicle_delivered_at',
        'bpkb_delivered_at',
        'recipient_name',
        'recipient_phone',
        'recipient_id_card',
        'recipient_relation',
        'officer_name',
        'handover_location',
        'handover_address',
        'bpkb_recipient_type',
        'checklist',
        'proof_file',
    ];

    protected static function booted(): void
    {
        static::creating(function (VehicleHandover $handover): void {
            if (blank($handover->handover_number)) {
                $handover->handover_number = static::generateHandoverNumber();
            }
        });

        static::deleting(function (VehicleHandover $handover): void {
            $handover->events()
                ->with('photos')
                ->get()
                ->each
                ->delete();
        });
    }

    public static function generateHandoverNumber(): string
    {
        $today = Carbon::now()->format('Ymd');
        $prefix = "BAST-{$today}-";
        $lastHandover = static::query()
            ->where('handover_number', 'LIKE', "{$prefix}%")
            ->orderByDesc('id')
            ->first();
        $nextSequence = 1;

        if (
            $lastHandover
            && preg_match('/-(\d{4})$/', $lastHandover->handover_number, $matches)
        ) {
            $nextSequence = ((int) $matches[1]) + 1;
        }

        return $prefix.str_pad((string) $nextSequence, 4, '0', STR_PAD_LEFT);
    }

    public function refreshTrackingStatus(): void
    {
        $this->loadMissing('events.items');
        $hasVehicle = $this->hasDeliveredItem('vehicle');
        $hasBpkb = $this->hasDeliveredItem('bpkb');
        $status = $hasVehicle && $hasBpkb
            ? 'completed'
            : ($hasVehicle ? 'vehicle_delivered' : 'pending');

        if ($this->status !== $status) {
            $this->updateQuietly(['status' => $status]);
        }
    }

    public function hasDeliveredItem(string $itemCode): bool
    {
        if ($this->relationLoaded('events')) {
            return $this->events->contains(
                fn (VehicleHandoverEvent $event): bool => $event->items
                    ->contains('item_code', $itemCode),
            );
        }

        return $this->events()
            ->whereHas(
                'items',
                fn ($query) => $query->where('item_code', $itemCode),
            )
            ->exists();
    }

    public function eventForItem(string $itemCode): ?VehicleHandoverEvent
    {
        $events = $this->relationLoaded('events')
            ? $this->events
            : $this->events()->with(['items', 'photos'])->get();

        return $events->first(
            fn (VehicleHandoverEvent $event): bool => $event->items
                ->contains('item_code', $itemCode),
        );
    }

    private function latestTrackingEvent(): ?VehicleHandoverEvent
    {
        $events = $this->relationLoaded('events')
            ? $this->events
            : $this->events()->with(['items', 'photos'])->get();

        return $events->sortByDesc('occurred_at')->first();
    }

    /** @return Attribute<mixed, never> */
    protected function vehicleDeliveredAt(): Attribute
    {
        return Attribute::get(
            fn () => $this->eventForItem('vehicle')?->occurred_at,
        );
    }

    /** @return Attribute<mixed, never> */
    protected function bpkbDeliveredAt(): Attribute
    {
        return Attribute::get(
            fn () => $this->eventForItem('bpkb')?->occurred_at,
        );
    }

    /** @return Attribute<string|null, never> */
    protected function recipientName(): Attribute
    {
        return Attribute::get(
            fn (): ?string => $this->latestTrackingEvent()?->recipient_name,
        );
    }

    /** @return Attribute<string|null, never> */
    protected function recipientPhone(): Attribute
    {
        return Attribute::get(
            fn (): ?string => $this->latestTrackingEvent()?->recipient_phone,
        );
    }

    /** @return Attribute<string|null, never> */
    protected function recipientIdCard(): Attribute
    {
        return Attribute::get(
            fn (): ?string => $this->latestTrackingEvent()?->recipient_id_card,
        );
    }

    /** @return Attribute<string|null, never> */
    protected function recipientRelation(): Attribute
    {
        return Attribute::get(
            fn (): ?string => $this->latestTrackingEvent()?->recipient_relation,
        );
    }

    /** @return Attribute<string|null, never> */
    protected function officerName(): Attribute
    {
        return Attribute::get(
            fn (): ?string => $this->latestTrackingEvent()?->officer_name,
        );
    }

    /** @return Attribute<string|null, never> */
    protected function handoverLocation(): Attribute
    {
        return Attribute::get(
            fn (): ?string => $this->latestTrackingEvent()?->handover_location,
        );
    }

    /** @return Attribute<string|null, never> */
    protected function handoverAddress(): Attribute
    {
        return Attribute::get(
            fn (): ?string => $this->latestTrackingEvent()?->handover_address,
        );
    }

    /** @return Attribute<string|null, never> */
    protected function bpkbRecipientType(): Attribute
    {
        return Attribute::get(function (): ?string {
            $event = $this->eventForItem('bpkb');

            if ($event === null) {
                return null;
            }

            return $event->recipient_relation === 'leasing_officer'
                ? 'finance_company'
                : 'customer';
        });
    }

    /** @return Attribute<array<string, mixed>|null, never> */
    protected function checklist(): Attribute
    {
        return Attribute::get(function (): ?array {
            $event = $this->eventForItem('vehicle');

            if ($event === null) {
                return null;
            }

            $items = $event->items->keyBy('item_code');
            $condition = $event->vehicle_condition ?? [];

            return [
                'key_count' => (int) ($items->get('keys')?->quantity ?? 0),
                'has_stnk' => $items->has('stnk'),
                'has_bpkb' => $this->hasDeliveredItem('bpkb'),
                'has_faktur' => $this->hasDeliveredItem('invoice'),
                'has_manual_book' => $items->has('manual_book'),
                'has_service_book' => $items->has('service_book'),
                'has_toolkit' => $items->has('toolkit'),
                'has_spare_tire' => $items->has('spare_tire'),
                'fuel_level' => $condition['fuel_level'] ?? null,
                'cleanliness' => $condition['cleanliness'] ?? null,
            ];
        });
    }

    /** @return Attribute<string|null, never> */
    protected function proofFile(): Attribute
    {
        return Attribute::get(function (): ?string {
            $event = $this->eventForItem('vehicle')
                ?? $this->latestTrackingEvent();

            return $event?->photos->first()?->file_path;
        });
    }

    /** @return BelongsTo<Sale, $this> */
    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    /** @return BelongsTo<Car, $this> */
    public function car(): BelongsTo
    {
        return $this->belongsTo(Car::class)->withTrashed();
    }

    /** @return HasMany<VehicleHandoverEvent, $this> */
    public function events(): HasMany
    {
        return $this->hasMany(VehicleHandoverEvent::class)
            ->orderBy('occurred_at')
            ->orderBy('id');
    }
}

<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class VehicleHandoverEvent extends Model
{
    protected $fillable = [
        'event_type',
        'occurred_at',
        'recipient_name',
        'recipient_phone',
        'recipient_id_card',
        'recipient_relation',
        'officer_name',
        'handover_location',
        'handover_address',
        'vehicle_condition',
        'notes',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'occurred_at' => 'datetime',
            'vehicle_condition' => 'array',
        ];
    }

    protected static function booted(): void
    {
        static::deleting(function (VehicleHandoverEvent $event): void {
            $event->photos()->get()->each->delete();
        });
    }

    /** @return BelongsTo<VehicleHandover, $this> */
    public function handover(): BelongsTo
    {
        return $this->belongsTo(VehicleHandover::class, 'vehicle_handover_id');
    }

    /** @return BelongsTo<User, $this> */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /** @return HasMany<VehicleHandoverItem, $this> */
    public function items(): HasMany
    {
        return $this->hasMany(VehicleHandoverItem::class)
            ->orderBy('id');
    }

    /** @return HasMany<VehicleHandoverPhoto, $this> */
    public function photos(): HasMany
    {
        return $this->hasMany(VehicleHandoverPhoto::class)
            ->orderBy('id');
    }
}

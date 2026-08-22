<?php

declare(strict_types=1);

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VehicleHandover extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'vehicle_handovers';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'handover_number',
        'sale_id',
        'car_id',
        'recipient_name',
        'recipient_phone',
        'recipient_id_card',
        'recipient_relation',
        'officer_name',
        'handover_location',
        'handover_address',
        'vehicle_delivered_at',
        'bpkb_delivered_at',
        'bpkb_recipient_type',
        'status',
        'checklist',
        'notes',
        'proof_file',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'checklist' => 'array',
        'vehicle_delivered_at' => 'datetime',
        'bpkb_delivered_at' => 'datetime',
    ];

    /**
     * Boot the model.
     */
    protected static function booted(): void
    {
        static::creating(function (VehicleHandover $handover): void {
            if (empty($handover->handover_number)) {
                $handover->handover_number = static::generateHandoverNumber();
            }

            $handover->determineStatus();
        });

        static::updating(function (VehicleHandover $handover): void {
            $handover->determineStatus();
        });
    }

    /**
     * Generate sequential BAST handover number: BAST-YYYYMMDD-XXXX
     */
    public static function generateHandoverNumber(): string
    {
        $today = Carbon::now()->format('Ymd');
        $prefix = "BAST-{$today}-";

        $lastHandover = static::query()
            ->where('handover_number', 'LIKE', "{$prefix}%")
            ->orderByDesc('id')
            ->first();

        $nextSequence = 1;

        if ($lastHandover && preg_match('/-(\d{4})$/', $lastHandover->handover_number, $matches)) {
            $nextSequence = ((int) $matches[1]) + 1;
        }

        return $prefix.str_pad((string) $nextSequence, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Auto determine handover status.
     */
    public function determineStatus(): void
    {
        if ($this->bpkb_delivered_at !== null && $this->vehicle_delivered_at !== null) {
            $this->status = 'completed';
        } elseif ($this->vehicle_delivered_at !== null) {
            $this->status = 'vehicle_delivered';
        } else {
            $this->status = 'pending';
        }
    }

    /**
     * Get the associated sale transaction.
     *
     * @return BelongsTo<Sale, $this>
     */
    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    /**
     * Get the associated car unit.
     *
     * @return BelongsTo<Car, $this>
     */
    public function car(): BelongsTo
    {
        return $this->belongsTo(Car::class);
    }
}

<?php

namespace App\Models;

use Database\Factories\PurchaseFactory;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

class Purchase extends Model
{
    /** @use HasFactory<PurchaseFactory> */
    use HasFactory;

    protected $fillable = [
        'purchase_number',
        'car_id',
        'purchase_date',
        'price',
        'repair_cost',
        'transport_cost',
        'other_cost',
        'document_process_cost',
        'status',
        'notes',
    ];

    protected $appends = [
        'total_capital',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'purchase_date' => 'date:Y-m-d',
            'price' => 'integer',
            'repair_cost' => 'integer',
            'transport_cost' => 'integer',
            'other_cost' => 'integer',
            'document_process_cost' => 'integer',
        ];
    }

    /**
     * Generate a unique purchase number.
     */
    public static function generatePurchaseNumber(\DateTimeInterface|string|null $date = null): string
    {
        do {
            $dateStr = $date ? Carbon::parse($date)->format('Ymd') : now()->format('Ymd');
            $number = 'MDL-'.$dateStr.'-'.Str::upper(Str::random(6));
        } while (static::query()->where('purchase_number', $number)->exists());

        return $number;
    }

    public const STATUS_LABELS = [
        'draft' => 'Draft',
        'completed' => 'Aktif',
        'cancelled' => 'Dibatalkan',
    ];

    /**
     * Generate a readable capital number before saving a new record.
     */
    protected static function booted(): void
    {
        static::creating(function (Purchase $purchase): void {
            if (filled($purchase->purchase_number)) {
                return;
            }

            $purchase->purchase_number = static::generatePurchaseNumber($purchase->purchase_date);
        });
    }

    public function calculateTotalCapital(): int
    {
        return (int) $this->price
            + (int) $this->repair_cost
            + (int) $this->transport_cost
            + (int) $this->other_cost
            + (int) $this->document_process_cost;
    }

    /**
     * @return Attribute<int, never>
     */
    protected function totalCapital(): Attribute
    {
        return Attribute::get(fn (): int => $this->calculateTotalCapital());
    }

    /**
     * Get the purchased car.
     */
    /**
     * @return BelongsTo<Car, $this>
     */
    public function car(): BelongsTo
    {
        return $this->belongsTo(Car::class)->withTrashed();
    }
}

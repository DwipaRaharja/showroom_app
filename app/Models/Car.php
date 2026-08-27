<?php

namespace App\Models;

use Database\Factories\CarFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

class Car extends Model
{
    /** @use HasFactory<CarFactory> */
    use HasFactory, SoftDeletes;

    public const STATUS_LABELS = [
        'available' => 'Tersedia',
        'booked' => 'Dibooking',
        'sold' => 'Terjual',
        'maintenance' => 'Perbaikan',
    ];

    protected static function booted(): void
    {
        static::deleting(function (Car $car): void {
            if (! $car->isForceDeleting()) {
                return;
            }

            $car->documentAttachment?->delete();
            $car->documents()->get()->each->delete();

            if ($car->image !== null) {
                Storage::disk('local')->delete($car->image);
            }
        });
    }

    protected $fillable = [
        'brand_id',
        'name',
        'license_plate',
        'chassis_number',
        'engine_number',
        'year',
        'color',
        'transmission',
        'fuel_type',
        'mileage',
        'selling_price',
        'status',
        'description',
        'image',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'year' => 'integer',
            'mileage' => 'integer',
            'selling_price' => 'integer',
        ];
    }

    /**
     * Get the brand that owns the car.
     *
     * @return BelongsTo<Brand, $this>
     */
    public function brand(): BelongsTo
    {
        return $this->belongsTo(Brand::class);
    }

    /**
     * Get the capital ledger attached to this vehicle.
     *
     * @return HasOne<Purchase, $this>
     */
    public function capital(): HasOne
    {
        return $this->hasOne(Purchase::class);
    }

    /**
     * Alias relationship for purchase/capital.
     *
     * @return HasOne<Purchase, $this>
     */
    public function purchase(): HasOne
    {
        return $this->capital();
    }

    /**
     * Get the sale transaction for the car.
     *
     * @return HasOne<Sale, $this>
     */
    public function sale(): HasOne
    {
        return $this->hasOne(Sale::class);
    }

    /**
     * Scope a query to only include cars available for a new sale or the current sale.
     *
     * @param  Builder<Car>  $query
     * @return Builder<Car>
     */
    public function scopeAvailableForSale(Builder $query, ?int $saleCarId = null): Builder
    {
        return $query->where(function ($q) use ($saleCarId) {
            $q->whereIn('status', ['available', 'booked'])
                ->whereDoesntHave('sale');
            if ($saleCarId) {
                $q->orWhere('id', $saleCarId);
            }
        });
    }

    /**
     * Get the vehicle documents registered for the car.
     *
     * @return HasMany<VehicleDocument, $this>
     */
    public function documents(): HasMany
    {
        return $this->hasMany(VehicleDocument::class)->orderBy('document_type');
    }

    /** @return HasOne<VehicleDocumentAttachment, $this> */
    public function documentAttachment(): HasOne
    {
        return $this->hasOne(VehicleDocumentAttachment::class);
    }

    /** @return HasMany<DocumentProcess, $this> */
    public function documentProcesses(): HasMany
    {
        return $this->hasMany(DocumentProcess::class)->latest('id');
    }
}

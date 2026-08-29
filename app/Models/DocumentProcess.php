<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class DocumentProcess extends Model
{
    public const CLOSED_STATUSES = [
        'completed',
        'cancelled',
    ];

    public const CANCELLABLE_STATUSES = [
        'waiting_documents',
        'processing',
        'issue',
    ];

    public const TYPE_LABELS = [
        'annual_tax' => 'Pajak tahunan',
        'five_year_tax' => 'Pajak lima tahunan / perpanjangan STNK',
        'name_transfer' => 'Balik nama',
        'mutation' => 'Mutasi kendaraan',
        'document_reissue' => 'Penerbitan ulang dokumen',
        'other' => 'Proses lainnya',
    ];

    public const STATUS_LABELS = [
        'waiting_documents' => 'Menunggu dokumen',
        'processing' => 'Sedang diproses',
        'completed' => 'Proses selesai',
        'issue' => 'Bermasalah',
        'cancelled' => 'Dibatalkan',
    ];

    protected $fillable = [
        'process_number',
        'car_id',
        'sale_id',
        'customer_id',
        'assigned_to',
        'created_by',
        'process_type',
        'status',
        'started_at',
        'estimated_completion_date',
        'completed_at',
        'returned_at',
        'cancelled_at',
        'processor_name',
        'processor_phone',
        'origin_region',
        'destination_region',
        'target_owner_name',
        'notes',
    ];

    protected $appends = [
        'total_cost',
        'capitalized_cost',
        'can_cancel',
        'can_delete_permanently',
    ];

    protected static function booted(): void
    {
        static::creating(function (DocumentProcess $process): void {
            if (blank($process->process_number)) {
                $process->process_number = static::generateProcessNumber();
            }
        });
    }

    protected function casts(): array
    {
        return [
            'started_at' => 'date:Y-m-d',
            'estimated_completion_date' => 'date:Y-m-d',
            'completed_at' => 'datetime',
            'returned_at' => 'datetime',
            'cancelled_at' => 'datetime',
        ];
    }

    public static function generateProcessNumber(): string
    {
        do {
            $number = 'BRK-'.now()->format('Ymd').'-'.Str::upper(Str::random(5));
        } while (static::query()->where('process_number', $number)->exists());

        return $number;
    }

    public function syncCarCapital(): void
    {
        $capital = $this->car()->withTrashed()->first()?->capital;

        if ($capital === null) {
            return;
        }

        $total = (int) DocumentProcessCost::query()
            ->where('paid_by', 'showroom')
            ->whereHas(
                'process',
                fn ($query) => $query
                    ->where('car_id', $this->car_id)
                    ->where('status', '!=', 'cancelled'),
            )
            ->sum('amount');

        $capital->updateQuietly(['document_process_cost' => $total]);
    }

    public function canBeCancelled(): bool
    {
        return in_array($this->status, self::CANCELLABLE_STATUSES, true);
    }

    public function canBeDeletedPermanently(): bool
    {
        if ($this->status === 'cancelled') {
            return true;
        }

        if ($this->status !== 'waiting_documents') {
            return false;
        }

        $eventCount = $this->relationLoaded('events')
            ? $this->events->count()
            : $this->events()->count();

        return $eventCount <= 1;
    }

    /** @return Attribute<bool, never> */
    protected function canCancel(): Attribute
    {
        return Attribute::get(fn (): bool => $this->canBeCancelled());
    }

    /** @return Attribute<bool, never> */
    protected function canDeletePermanently(): Attribute
    {
        return Attribute::get(fn (): bool => $this->canBeDeletedPermanently());
    }

    /** @return Attribute<int, never> */
    protected function totalCost(): Attribute
    {
        return Attribute::get(
            fn (): int => (int) ($this->relationLoaded('costs')
                ? $this->costs->sum('amount')
                : $this->costs()->sum('amount')),
        );
    }

    /** @return Attribute<int, never> */
    protected function capitalizedCost(): Attribute
    {
        return Attribute::get(
            fn (): int => (int) ($this->relationLoaded('costs')
                ? $this->costs->where('paid_by', 'showroom')->sum('amount')
                : $this->costs()->where('paid_by', 'showroom')->sum('amount')),
        );
    }

    /** @return BelongsTo<Car, $this> */
    public function car(): BelongsTo
    {
        return $this->belongsTo(Car::class)->withTrashed();
    }

    /** @return BelongsTo<Sale, $this> */
    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    /** @return BelongsTo<Customer, $this> */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    /** @return BelongsTo<User, $this> */
    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    /** @return BelongsTo<User, $this> */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /** @return HasMany<DocumentProcessItem, $this> */
    public function items(): HasMany
    {
        return $this->hasMany(DocumentProcessItem::class)->orderBy('id');
    }

    /** @return HasMany<DocumentProcessEvent, $this> */
    public function events(): HasMany
    {
        return $this->hasMany(DocumentProcessEvent::class)
            ->orderByDesc('occurred_at')
            ->orderByDesc('id');
    }

    /** @return HasMany<DocumentProcessCost, $this> */
    public function costs(): HasMany
    {
        return $this->hasMany(DocumentProcessCost::class)
            ->orderByDesc('paid_at')
            ->orderByDesc('id');
    }

    /** @return HasMany<DocumentProcessFile, $this> */
    public function files(): HasMany
    {
        return $this->hasMany(DocumentProcessFile::class)->orderByDesc('id');
    }
}

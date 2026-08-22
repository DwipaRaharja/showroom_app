<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * @property int $completed_items_count
 * @property int $total_items_count
 * @property int $progress_percentage
 */
class DocumentProcess extends Model
{
    public const REQUIRED_DOCUMENT_TYPES = [
        'stnk',
        'bpkb',
        'invoice',
        'receipt',
    ];

    protected $fillable = [
        'process_number',
        'sale_id',
        'assigned_to',
        'process_type',
        'status',
        'started_at',
        'estimated_completion_date',
        'completed_at',
        'handed_over_at',
        'notes',
    ];

    protected $appends = [
        'completed_items_count',
        'total_items_count',
        'progress_percentage',
    ];

    protected static function booted(): void
    {
        static::creating(function (DocumentProcess $process): void {
            if (filled($process->process_number)) {
                return;
            }

            $process->process_number = static::generateProcessNumber($process->created_at);
        });
    }

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'started_at' => 'date:Y-m-d',
            'estimated_completion_date' => 'date:Y-m-d',
            'completed_at' => 'datetime',
            'handed_over_at' => 'datetime',
        ];
    }

    public static function generateProcessNumber(?\DateTimeInterface $date = null): string
    {
        do {
            $dateString = $date ? Carbon::parse($date)->format('Ymd') : now()->format('Ymd');
            $number = 'BRK-'.$dateString.'-'.Str::upper(Str::random(6));
        } while (static::query()->where('process_number', $number)->exists());

        return $number;
    }

    public function syncItemsFromVehicleDocuments(): void
    {
        $this->loadMissing('sale.car.documents');
        $documents = $this->sale->car->documents;
        $types = collect(self::REQUIRED_DOCUMENT_TYPES)
            ->merge($documents->pluck('document_type'))
            ->unique()
            ->values();

        foreach ($types as $type) {
            $document = $documents->firstWhere('document_type', $type);
            $item = $this->items()->firstOrNew(['document_type' => $type]);
            $documentReady = $document?->status === 'complete' && $document->original_received;

            $item->fill([
                'vehicle_document_id' => $document?->id,
                'document_number_snapshot' => $document?->document_number,
                'required' => in_array($type, self::REQUIRED_DOCUMENT_TYPES, true),
            ]);

            if (! $item->exists || in_array($item->status, ['waiting', 'ready'], true)) {
                $item->status = $documentReady ? 'ready' : 'waiting';
            }

            $item->save();
        }

        $this->refreshWorkflowStatus();
    }

    public function refreshWorkflowStatus(): void
    {
        if ($this->status === 'cancelled') {
            return;
        }

        $items = $this->items()->get();
        $requiredItems = $items->where('required', true);

        if ($items->contains('status', 'issue')) {
            $status = 'issue';
        } elseif ($requiredItems->isNotEmpty() && $requiredItems->every(fn (DocumentProcessItem $item) => $item->status === 'handed_over')) {
            $status = 'handed_over';
        } elseif ($requiredItems->isNotEmpty() && $requiredItems->every(fn (DocumentProcessItem $item) => in_array($item->status, ['completed', 'handed_over'], true))) {
            $status = 'completed';
        } elseif ($requiredItems->contains(fn (DocumentProcessItem $item) => in_array($item->status, ['processing', 'completed', 'handed_over'], true))) {
            $status = 'processing';
        } elseif ($requiredItems->isNotEmpty() && $requiredItems->every(fn (DocumentProcessItem $item) => $item->status === 'ready')) {
            $status = 'ready';
        } else {
            $status = 'waiting_documents';
        }

        $attributes = ['status' => $status];

        if (in_array($status, ['completed', 'handed_over'], true)) {
            $attributes['completed_at'] = $this->completed_at ?? now();
        } else {
            $attributes['completed_at'] = null;
        }

        if ($status === 'handed_over') {
            $attributes['handed_over_at'] = $requiredItems->max('handed_over_at') ?? now();
        } else {
            $attributes['handed_over_at'] = null;
        }

        $this->updateQuietly($attributes);
        $this->refresh();
    }

    /** @return Attribute<int<0, max>, never> */
    protected function completedItemsCount(): Attribute
    {
        return Attribute::get(fn (): int => $this->itemCollection()
            ->whereIn('status', ['completed', 'handed_over'])
            ->count());
    }

    /** @return Attribute<int<0, max>, never> */
    protected function totalItemsCount(): Attribute
    {
        return Attribute::get(fn (): int => $this->itemCollection()->count());
    }

    /** @return Attribute<int, never> */
    protected function progressPercentage(): Attribute
    {
        return Attribute::get(function (): int {
            $total = $this->total_items_count;

            return $total === 0
                ? 0
                : (int) round(($this->completed_items_count / $total) * 100);
        });
    }

    /** @return Collection<int, DocumentProcessItem> */
    private function itemCollection(): Collection
    {
        return $this->relationLoaded('items')
            ? $this->items
            : $this->items()->get();
    }

    /** @return BelongsTo<Sale, $this> */
    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    /** @return BelongsTo<User, $this> */
    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    /** @return HasMany<DocumentProcessItem, $this> */
    public function items(): HasMany
    {
        return $this->hasMany(DocumentProcessItem::class)->orderBy('id');
    }

    /** @return HasMany<DocumentProcessActivity, $this> */
    public function activities(): HasMany
    {
        return $this->hasMany(DocumentProcessActivity::class)->latest('id');
    }
}

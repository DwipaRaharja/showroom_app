<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class DocumentProcessCost extends Model
{
    public const TYPE_LABELS = [
        'tax' => 'Pokok pajak',
        'penalty' => 'Denda',
        'administration' => 'Administrasi / PNBP',
        'agent_fee' => 'Jasa pengurusan',
        'courier' => 'Transportasi / kurir',
        'other' => 'Biaya lainnya',
    ];

    protected $fillable = [
        'cost_type',
        'description',
        'amount',
        'paid_by',
        'paid_at',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'integer',
            'paid_at' => 'date:Y-m-d',
        ];
    }

    protected static function booted(): void
    {
        static::saved(function (DocumentProcessCost $cost): void {
            $cost->process()->first()?->syncCarCapital();
        });

        static::deleted(function (DocumentProcessCost $cost): void {
            $cost->process()->first()?->syncCarCapital();
        });
    }

    /** @return BelongsTo<DocumentProcess, $this> */
    public function process(): BelongsTo
    {
        return $this->belongsTo(DocumentProcess::class, 'document_process_id');
    }

    /** @return BelongsTo<User, $this> */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /** @return HasOne<DocumentProcessFile, $this> */
    public function receipt(): HasOne
    {
        return $this->hasOne(DocumentProcessFile::class);
    }
}

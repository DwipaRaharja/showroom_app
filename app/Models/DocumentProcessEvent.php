<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DocumentProcessEvent extends Model
{
    protected $fillable = [
        'status',
        'occurred_at',
        'description',
        'location',
        'recipient_name',
        'recipient_phone',
        'recipient_relation',
        'notes',
        'result_data',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'occurred_at' => 'datetime',
            'result_data' => 'array',
        ];
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

    /** @return HasMany<DocumentProcessFile, $this> */
    public function files(): HasMany
    {
        return $this->hasMany(DocumentProcessFile::class)->orderBy('id');
    }
}

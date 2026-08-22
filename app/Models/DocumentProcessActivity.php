<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DocumentProcessActivity extends Model
{
    protected $fillable = [
        'document_process_id',
        'user_id',
        'type',
        'description',
        'metadata',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return ['metadata' => 'array'];
    }

    /** @return BelongsTo<DocumentProcess, $this> */
    public function documentProcess(): BelongsTo
    {
        return $this->belongsTo(DocumentProcess::class);
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}

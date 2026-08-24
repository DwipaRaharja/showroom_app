<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class DocumentProcessFile extends Model
{
    protected $fillable = [
        'document_process_event_id',
        'document_process_cost_id',
        'uploaded_by',
        'file_category',
        'file_path',
        'file_name',
        'file_mime',
        'file_size',
        'caption',
    ];

    protected function casts(): array
    {
        return [
            'file_size' => 'integer',
        ];
    }

    protected static function booted(): void
    {
        static::deleted(function (DocumentProcessFile $file): void {
            Storage::disk('local')->delete($file->file_path);
        });
    }

    /** @return BelongsTo<DocumentProcess, $this> */
    public function process(): BelongsTo
    {
        return $this->belongsTo(DocumentProcess::class, 'document_process_id');
    }

    /** @return BelongsTo<DocumentProcessEvent, $this> */
    public function event(): BelongsTo
    {
        return $this->belongsTo(DocumentProcessEvent::class, 'document_process_event_id');
    }

    /** @return BelongsTo<DocumentProcessCost, $this> */
    public function cost(): BelongsTo
    {
        return $this->belongsTo(DocumentProcessCost::class, 'document_process_cost_id');
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DocumentProcessItem extends Model
{
    protected $fillable = [
        'document_process_id',
        'vehicle_document_id',
        'document_type',
        'document_number_snapshot',
        'required',
        'status',
        'recipient_type',
        'recipient_name',
        'handed_over_at',
        'notes',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'required' => 'boolean',
            'handed_over_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<DocumentProcess, $this> */
    public function documentProcess(): BelongsTo
    {
        return $this->belongsTo(DocumentProcess::class);
    }

    /** @return BelongsTo<VehicleDocument, $this> */
    public function vehicleDocument(): BelongsTo
    {
        return $this->belongsTo(VehicleDocument::class);
    }
}

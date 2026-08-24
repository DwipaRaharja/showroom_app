<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DocumentProcessItem extends Model
{
    protected $fillable = [
        'vehicle_document_id',
        'item_key',
        'item_name',
        'required',
        'custody_status',
        'received_at',
        'returned_at',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'required' => 'boolean',
            'received_at' => 'datetime',
            'returned_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<DocumentProcess, $this> */
    public function process(): BelongsTo
    {
        return $this->belongsTo(DocumentProcess::class, 'document_process_id');
    }

    /** @return BelongsTo<VehicleDocument, $this> */
    public function vehicleDocument(): BelongsTo
    {
        return $this->belongsTo(VehicleDocument::class);
    }
}

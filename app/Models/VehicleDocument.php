<?php

namespace App\Models;

use Database\Factories\VehicleDocumentFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class VehicleDocument extends Model
{
    /** @use HasFactory<VehicleDocumentFactory> */
    use HasFactory;

    protected $fillable = [
        'document_type',
        'document_number',
        'owner_name',
        'issued_at',
        'expires_at',
        'status',
        'original_received',
        'file_path',
        'file_name',
        'file_mime',
        'file_size',
        'notes',
    ];

    protected static function booted(): void
    {
        static::saved(function (VehicleDocument $document): void {
            $document->syncActiveDocumentProcess();
        });

        static::deleted(function (VehicleDocument $document): void {
            if ($document->file_path !== null) {
                Storage::disk('local')->delete($document->file_path);
            }

            $document->syncActiveDocumentProcess();
        });
    }

    private function syncActiveDocumentProcess(): void
    {
        $process = $this->car?->sale?->documentProcess;

        if ($process && $process->status !== 'cancelled') {
            $process->syncItemsFromVehicleDocuments();
        }
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'issued_at' => 'date:Y-m-d',
            'expires_at' => 'date:Y-m-d',
            'original_received' => 'boolean',
            'file_size' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<Car, $this>
     */
    public function car(): BelongsTo
    {
        return $this->belongsTo(Car::class)->withTrashed();
    }
}

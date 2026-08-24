<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class VehicleHandoverPhoto extends Model
{
    protected $fillable = [
        'file_path',
        'file_name',
        'file_mime',
        'file_size',
        'caption',
    ];

    protected function casts(): array
    {
        return ['file_size' => 'integer'];
    }

    protected static function booted(): void
    {
        static::deleted(function (VehicleHandoverPhoto $photo): void {
            Storage::disk('local')->delete($photo->file_path);
        });
    }

    /** @return BelongsTo<VehicleHandoverEvent, $this> */
    public function event(): BelongsTo
    {
        return $this->belongsTo(VehicleHandoverEvent::class, 'vehicle_handover_event_id');
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class VehicleDocumentAttachment extends Model
{
    protected $fillable = [
        'file_path',
        'file_name',
        'file_mime',
        'file_size',
    ];

    protected static function booted(): void
    {
        static::deleted(function (VehicleDocumentAttachment $attachment): void {
            if ($attachment->file_path !== null) {
                Storage::disk('local')->delete($attachment->file_path);
            }
        });
    }

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'file_size' => 'integer',
        ];
    }

    /** @return BelongsTo<Car, $this> */
    public function car(): BelongsTo
    {
        return $this->belongsTo(Car::class)->withTrashed();
    }
}

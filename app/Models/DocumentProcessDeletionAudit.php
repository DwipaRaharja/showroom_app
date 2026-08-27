<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DocumentProcessDeletionAudit extends Model
{
    protected $fillable = [
        'car_id',
        'deleted_by',
        'process_number',
        'process_type',
        'status',
        'reason',
        'snapshot',
        'deleted_at',
    ];

    protected function casts(): array
    {
        return [
            'snapshot' => 'array',
            'deleted_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<Car, $this> */
    public function car(): BelongsTo
    {
        return $this->belongsTo(Car::class)->withTrashed();
    }

    /** @return BelongsTo<User, $this> */
    public function deletedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'deleted_by');
    }
}

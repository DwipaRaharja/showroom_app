<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VehicleHandoverItem extends Model
{
    public const LABELS = [
        'vehicle' => 'Unit kendaraan',
        'stnk' => 'STNK asli',
        'bpkb' => 'BPKB asli',
        'invoice' => 'Faktur kendaraan',
        'keys' => 'Kunci kendaraan',
        'manual_book' => 'Buku manual',
        'service_book' => 'Buku servis',
        'toolkit' => 'Toolkit dan dongkrak',
        'spare_tire' => 'Ban cadangan',
        'blanko' => 'Blanko dokumen',
        'other' => 'Barang lainnya',
    ];

    protected $fillable = [
        'item_code',
        'item_name',
        'quantity',
        'notes',
    ];

    protected function casts(): array
    {
        return ['quantity' => 'integer'];
    }

    /** @return BelongsTo<VehicleHandoverEvent, $this> */
    public function event(): BelongsTo
    {
        return $this->belongsTo(VehicleHandoverEvent::class, 'vehicle_handover_event_id');
    }
}

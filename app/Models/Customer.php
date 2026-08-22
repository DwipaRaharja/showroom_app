<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Customer extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'phone',
        'ktp_number',
        'address',
    ];

    /**
     * Get purchase transactions where this customer is the seller.
     */
    public function purchases(): HasMany
    {
        return $this->hasMany(Purchase::class, 'seller_id');
    }

    /**
     * Get sales transactions where this customer is the buyer.
     */
    public function sales(): HasMany
    {
        return $this->hasMany(Sale::class, 'customer_id');
    }

    /**
     * Scope a query to include active customers and optionally a specifically selected soft-deleted customer.
     */
    public function scopeActiveForDropdown(Builder $query, ?int $selectedId = null): Builder
    {
        return $query->withTrashed()
            ->where(function (Builder $q) use ($selectedId) {
                $q->whereNull('deleted_at')
                    ->when($selectedId, function ($subQ, $id) {
                        $subQ->orWhere('id', $id);
                    });
            });
    }
}

<?php

namespace App\Models;

use Database\Factories\CustomerFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\SoftDeletingScope;

class Customer extends Model
{
    /** @use HasFactory<CustomerFactory> */
    use HasFactory;

    use SoftDeletes;

    protected $fillable = [
        'name',
        'phone',
        'ktp_number',
        'address',
    ];

    /**
     * Get purchase transactions where this customer is the seller.
     *
     * @return HasMany<Purchase, $this>
     */
    public function purchases(): HasMany
    {
        return $this->hasMany(Purchase::class, 'seller_id');
    }

    /**
     * Get sales transactions where this customer is the buyer.
     *
     * @return HasMany<Sale, $this>
     */
    public function sales(): HasMany
    {
        return $this->hasMany(Sale::class, 'customer_id');
    }

    /**
     * Scope a query to include active customers and optionally a specifically selected soft-deleted customer.
     *
     * @param  Builder<Customer>  $query
     * @return Builder<Customer>
     */
    public function scopeActiveForDropdown(Builder $query, ?int $selectedId = null): Builder
    {
        return $query->withoutGlobalScope(SoftDeletingScope::class)
            ->where(function (Builder $customerQuery) use ($selectedId) {
                $customerQuery->whereNull('deleted_at')
                    ->when($selectedId, function ($subQ, $id) {
                        $subQ->orWhere('id', $id);
                    });
            });
    }
}

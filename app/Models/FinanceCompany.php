<?php

namespace App\Models;

use Database\Factories\FinanceCompanyFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FinanceCompany extends Model
{
    /** @use HasFactory<FinanceCompanyFactory> */
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'pic_name',
        'pic_phone',
        'is_active',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    /**
     * Get the sales financed by this company.
     */
    public function sales(): HasMany
    {
        return $this->hasMany(Sale::class);
    }
}

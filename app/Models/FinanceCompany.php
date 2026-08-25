<?php

namespace App\Models;

use Database\Factories\FinanceCompanyFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

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

    protected static function booted(): void
    {
        static::saving(function (FinanceCompany $company): void {
            $company->code = filled($company->code)
                ? Str::upper(trim($company->code))
                : null;
        });
    }

    /**
     * Get the sales financed by this company.
     *
     * @return HasMany<Sale, $this>
     */
    public function sales(): HasMany
    {
        return $this->hasMany(Sale::class);
    }
}

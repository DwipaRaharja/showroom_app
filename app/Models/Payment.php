<?php

namespace App\Models;

use Database\Factories\PaymentFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

class Payment extends Model
{
    /** @use HasFactory<PaymentFactory> */
    use HasFactory;

    protected $fillable = [
        'payment_number',
        'sale_id',
        'payment_date',
        'payer_type',
        'payment_category',
        'amount',
        'payment_method',
        'destination_account',
        'reference_number',
        'status',
        'notes',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'payment_date' => 'date:Y-m-d',
            'amount' => 'integer',
        ];
    }

    /**
     * Generate a unique payment receipt number.
     */
    public static function generatePaymentNumber(\DateTimeInterface|string|null $date = null): string
    {
        do {
            $dateStr = $date ? Carbon::parse($date)->format('Ymd') : now()->format('Ymd');
            $number = 'PAY-'.$dateStr.'-'.Str::upper(Str::random(6));
        } while (static::query()->where('payment_number', $number)->exists());

        return $number;
    }

    /**
     * Boot model events to auto-generate receipt number and refresh sale status.
     */
    protected static function booted(): void
    {
        static::creating(function (Payment $payment): void {
            if (filled($payment->payment_number)) {
                return;
            }

            $payment->payment_number = static::generatePaymentNumber($payment->payment_date);
        });

        static::saved(function (Payment $payment): void {
            $payment->sale?->refreshSettlementStatus();
        });

        static::deleted(function (Payment $payment): void {
            $payment->sale?->refreshSettlementStatus();
        });
    }

    /**
     * Get the sale transaction for this payment.
     *
     * @return BelongsTo<Sale, $this>
     */
    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }
}

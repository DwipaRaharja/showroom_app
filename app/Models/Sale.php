<?php

namespace App\Models;

use Database\Factories\SaleFactory;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * @property int $total_paid
 * @property int $remaining_bill
 * @property int $total_finance_disbursed
 * @property int $remaining_finance_disbursement
 * @property int $customer_payment_shortfall
 * @property int $total_bonus_paid
 * @property bool $is_settled
 * @property bool $has_down_payment
 * @property bool $can_accept_payment
 */
class Sale extends Model
{
    /** @use HasFactory<SaleFactory> */
    use HasFactory;

    protected $fillable = [
        'invoice_number',
        'car_id',
        'customer_id',
        'finance_company_id',
        'payment_type',
        'deal_price',
        'down_payment',
        'finance_amount',
        'disbursement_estimated_date',
        'disbursement_actual_date',
        'leasing_bonus',
        'due_date',
        'status',
        'notes',
        'trade_in_license_plate',
        'trade_in_brand',
        'trade_in_car_name',
        'trade_in_year',
        'trade_in_color',
        'trade_in_mileage',
        'trade_in_notes',
    ];

    protected $appends = [
        'total_paid',
        'remaining_bill',
        'total_finance_disbursed',
        'remaining_finance_disbursement',
        'customer_payment_shortfall',
        'total_bonus_paid',
        'is_settled',
        'has_down_payment',
        'can_accept_payment',
        'can_deliver_vehicle',
        'can_deliver_bpkb',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'deal_price' => 'integer',
            'down_payment' => 'integer',
            'finance_amount' => 'integer',
            'leasing_bonus' => 'integer',
            'trade_in_year' => 'integer',
            'trade_in_mileage' => 'integer',
            'disbursement_estimated_date' => 'date:Y-m-d',
            'disbursement_actual_date' => 'date:Y-m-d',
            'due_date' => 'date:Y-m-d',
        ];
    }

    /**
     * Generate a unique invoice number.
     */
    public static function generateInvoiceNumber(?\DateTimeInterface $date = null): string
    {
        do {
            $dateStr = $date ? Carbon::parse($date)->format('Ymd') : now()->format('Ymd');
            $number = 'INV-'.$dateStr.'-'.Str::upper(Str::random(6));
        } while (static::query()->where('invoice_number', $number)->exists());

        return $number;
    }

    /**
     * Generate invoice number before saving new record.
     */
    protected static function booted(): void
    {
        static::creating(function (Sale $sale): void {
            if (filled($sale->invoice_number)) {
                return;
            }

            $sale->invoice_number = static::generateInvoiceNumber($sale->created_at);
        });
    }

    /**
     * Total confirmed payments received toward the deal price (excluding bonus).
     *
     * @return Attribute<int, never>
     */
    protected function totalPaid(): Attribute
    {
        return Attribute::make(
            get: function () {
                if ($this->relationLoaded('payments')) {
                    return (int) $this->payments
                        ->where('status', 'confirmed')
                        ->where('payment_category', '!=', 'leasing_bonus')
                        ->sum('amount');
                }

                return (int) $this->payments()
                    ->where('status', 'confirmed')
                    ->where('payment_category', '!=', 'leasing_bonus')
                    ->sum('amount');
            }
        );
    }

    /**
     * Remaining bill amount (piutang).
     *
     * @return Attribute<int, never>
     */
    protected function remainingBill(): Attribute
    {
        return Attribute::make(
            get: fn () => max(0, $this->deal_price - $this->total_paid)
        );
    }

    /**
     * Total confirmed principal disbursement received from the finance company.
     *
     * @return Attribute<int, never>
     */
    protected function totalFinanceDisbursed(): Attribute
    {
        return Attribute::make(
            get: function () {
                if ($this->relationLoaded('payments')) {
                    return (int) $this->payments
                        ->where('status', 'confirmed')
                        ->where('payment_category', 'finance_disbursement')
                        ->sum('amount');
                }

                return (int) $this->payments()
                    ->where('status', 'confirmed')
                    ->where('payment_category', 'finance_disbursement')
                    ->sum('amount');
            }
        );
    }

    /**
     * Principal amount still expected from the finance company.
     *
     * @return Attribute<int, never>
     */
    protected function remainingFinanceDisbursement(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->payment_type === 'credit'
                ? max(0, $this->finance_amount - $this->total_finance_disbursed)
                : 0
        );
    }

    /**
     * Balance that is not covered by the remaining agreed finance disbursement.
     *
     * This is the customer/DP obligation that must not be considered paid merely
     * because a credit agreement exists.
     *
     * @return Attribute<int, never>
     */
    protected function customerPaymentShortfall(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->payment_type === 'credit'
                ? max(0, $this->remaining_bill - $this->remaining_finance_disbursement)
                : $this->remaining_bill
        );
    }

    /**
     * Total confirmed bonus received from leasing.
     *
     * @return Attribute<int, never>
     */
    protected function totalBonusPaid(): Attribute
    {
        return Attribute::make(
            get: function () {
                if ($this->relationLoaded('payments')) {
                    return (int) $this->payments
                        ->where('status', 'confirmed')
                        ->where('payment_category', 'leasing_bonus')
                        ->sum('amount');
                }

                return (int) $this->payments()
                    ->where('status', 'confirmed')
                    ->where('payment_category', 'leasing_bonus')
                    ->sum('amount');
            }
        );
    }

    /**
     * Check if the sale is fully settled.
     *
     * @return Attribute<bool, never>
     */
    protected function isSettled(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->remaining_bill <= 0
        );
    }

    /**
     * Check whether a DP / booking payment has already been recorded.
     *
     * @return Attribute<bool, never>
     */
    protected function hasDownPayment(): Attribute
    {
        return Attribute::make(
            get: function () {
                if ($this->relationLoaded('payments')) {
                    return $this->payments->contains(
                        'payment_category',
                        'down_payment'
                    );
                }

                return $this->payments()
                    ->where('payment_category', 'down_payment')
                    ->exists();
            }
        );
    }

    /**
     * Check whether the transaction still has an amount that can be received.
     *
     * @return Attribute<bool, never>
     */
    protected function canAcceptPayment(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->status !== 'cancelled'
                && (
                    (
                        $this->payment_type === 'credit'
                            ? $this->customer_payment_shortfall > 0
                            : $this->remaining_bill > 0
                    )
                    || (
                        $this->payment_type === 'credit'
                        && $this->total_bonus_paid < $this->leasing_bonus
                    )
                )
        );
    }

    /**
     * Check whether the vehicle unit + STNK can be handed over.
     *
     * For credit sales, the agreed but not-yet-disbursed leasing principal is
     * excluded so only the uncovered customer obligation is compared to the
     * ten-million handover tolerance.
     *
     * @return Attribute<bool, never>
     */
    protected function canDeliverVehicle(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->status !== 'cancelled'
                && $this->customer_payment_shortfall <= 10_000_000
        );
    }

    /**
     * Check whether BPKB & original legal documents can be handed over.
     *
     * A credit sale may hand BPKB to the leasing officer when the remaining
     * agreed leasing principal fully covers the bill. The handover transaction
     * will then confirm that disbursement as an actual payment.
     *
     * @return Attribute<bool, never>
     */
    protected function canDeliverBpkb(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->status !== 'cancelled'
                && $this->customer_payment_shortfall <= 0
        );
    }

    /**
     * Recalculate and update the sale's and car's status based on payments.
     */
    public function refreshSettlementStatus(): void
    {
        $this->unsetRelation('payments');
        $remaining = $this->remaining_bill;

        if ($remaining <= 0) {
            $this->update(['status' => 'completed']);
            $this->car?->update(['status' => 'sold']);
        } elseif ($this->total_paid > 0) {
            $this->update(['status' => 'partial']);
            $this->car?->update(['status' => 'booked']);
        } else {
            $this->update(['status' => 'pending']);
            $this->car?->update(['status' => 'booked']);
        }
    }

    /**
     * Get the car sold in this transaction.
     *
     * @return BelongsTo<Car, $this>
     */
    public function car(): BelongsTo
    {
        return $this->belongsTo(Car::class)->withTrashed();
    }

    /**
     * Get the customer (buyer).
     *
     * @return BelongsTo<Customer, $this>
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class)->withTrashed();
    }

    /**
     * Get the finance company (leasing).
     *
     * @return BelongsTo<FinanceCompany, $this>
     */
    public function financeCompany(): BelongsTo
    {
        return $this->belongsTo(FinanceCompany::class);
    }

    /**
     * Get all payment receipts for this sale.
     *
     * @return HasMany<Payment, $this>
     */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    /**
     * Get the vehicle handover (BAST) record.
     *
     * @return HasOne<VehicleHandover, $this>
     */
    public function handover(): HasOne
    {
        return $this->hasOne(VehicleHandover::class);
    }
}

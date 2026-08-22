<?php

namespace Database\Factories;

use App\Models\Payment;
use App\Models\Sale;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Carbon;

/**
 * @extends Factory<Payment>
 */
class PaymentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $paymentDate = fake()->dateTimeBetween('-6 months', 'now')->format('Y-m-d');

        return [
            'payment_number' => fn (array $attributes) => Payment::generatePaymentNumber(
                isset($attributes['payment_date']) ? Carbon::parse($attributes['payment_date']) : Carbon::parse($paymentDate)
            ),
            'sale_id' => Sale::factory(),
            'payment_date' => $paymentDate,
            'payer_type' => fake()->randomElement(['customer', 'finance']),
            'payment_category' => fake()->randomElement(['down_payment', 'settlement', 'installment', 'finance_disbursement', 'leasing_bonus']),
            'amount' => fake()->numberBetween(10, 300) * 1_000_000,
            'payment_method' => fake()->randomElement(['transfer', 'transfer', 'cash', 'qris']),
            'destination_account' => fake()->randomElement(['BCA Showroom (0123-456-789)', 'Mandiri Showroom (1400-987-654)', 'Kas Tunai Showroom']),
            'reference_number' => strtoupper(fake()->bothify('TRX-#####-????')),
            'status' => 'confirmed',
            'notes' => fake()->optional()->sentence(),
        ];
    }
}

<?php

namespace Database\Factories;

use App\Models\Car;
use App\Models\Customer;
use App\Models\FinanceCompany;
use App\Models\Sale;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Carbon;

/**
 * @extends Factory<Sale>
 */
class SaleFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $createdDate = fake()->dateTimeBetween('-6 months', 'now');
        $paymentType = fake()->randomElement(['cash_full', 'cash_tempo', 'credit']);
        $dealPrice = fake()->numberBetween(150, 800) * 1_000_000;

        $downPayment = 0;
        $financeAmount = 0;
        $disbursementEstDate = null;
        $leasingBonus = 0;
        $dueDate = null;
        $financeCompanyId = null;

        if ($paymentType === 'cash_full') {
            $status = 'completed';
        } elseif ($paymentType === 'cash_tempo') {
            $downPayment = (int) ($dealPrice * fake()->randomFloat(2, 0.15, 0.35));
            $dueDate = Carbon::parse($createdDate)->addDays(fake()->numberBetween(7, 30))->format('Y-m-d');
            $status = fake()->randomElement(['partial', 'completed']);
        } else { // credit
            $financeCompanyId = FinanceCompany::query()->inRandomOrder()->value('id')
                ?? FinanceCompany::factory();
            $downPayment = (int) ($dealPrice * fake()->randomFloat(2, 0.15, 0.25));
            $financeAmount = $dealPrice - $downPayment;
            $disbursementEstDate = Carbon::parse($createdDate)->addDays(fake()->numberBetween(3, 14))->format('Y-m-d');
            $leasingBonus = fake()->numberBetween(2, 6) * 1_000_000;
            $status = fake()->randomElement(['partial', 'completed']);
        }

        return [
            'invoice_number' => fn (array $attributes) => Sale::generateInvoiceNumber(
                isset($attributes['created_at']) ? Carbon::parse($attributes['created_at']) : Carbon::parse($createdDate)
            ),
            'car_id' => Car::factory(),
            'customer_id' => Customer::factory(),
            'finance_company_id' => $financeCompanyId,
            'payment_type' => $paymentType,
            'deal_price' => $dealPrice,
            'down_payment' => $downPayment,
            'finance_amount' => $financeAmount,
            'disbursement_estimated_date' => $disbursementEstDate,
            'disbursement_actual_date' => $status === 'completed' && $disbursementEstDate ? Carbon::parse($disbursementEstDate)->addDays(fake()->numberBetween(-1, 2))->format('Y-m-d') : null,
            'leasing_bonus' => $leasingBonus,
            'due_date' => $dueDate,
            'status' => $status,
            'notes' => fake()->optional()->sentence(),
            'created_at' => $createdDate,
            'updated_at' => $createdDate,
        ];
    }

    /**
     * Indicate that the sale is a trade-in transaction.
     */
    public function tradeIn(): static
    {
        return $this->state(fn (array $attributes) => [
            'payment_type' => 'trade_in',
            'finance_company_id' => null,
            'finance_amount' => 0,
            'disbursement_estimated_date' => null,
            'disbursement_actual_date' => null,
            'leasing_bonus' => 0,
            'due_date' => null,
            'trade_in_license_plate' => fake()->bothify('DT #### ??'),
            'trade_in_brand' => fake()->randomElement(['Toyota', 'Honda', 'Daihatsu', 'Mitsubishi']),
            'trade_in_car_name' => fake()->randomElement(['Avanza 1.3 G', 'Brio Satya E', 'Xenia 1.3 R', 'Xpander Ultimate']),
            'trade_in_year' => fake()->numberBetween(2015, 2022),
            'trade_in_color' => fake()->randomElement(['Hitam', 'Putih', 'Silver', 'Abu-abu']),
            'trade_in_mileage' => fake()->numberBetween(20000, 100000),
            'trade_in_notes' => fake()->optional()->sentence(),
        ]);
    }
}

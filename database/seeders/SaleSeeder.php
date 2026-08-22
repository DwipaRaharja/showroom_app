<?php

namespace Database\Seeders;

use App\Models\Car;
use App\Models\Customer;
use App\Models\FinanceCompany;
use App\Models\Payment;
use App\Models\Sale;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class SaleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        if (FinanceCompany::count() === 0) {
            $this->call(FinanceCompanySeeder::class);
        }

        if (Customer::count() === 0) {
            $this->call(CustomerSeeder::class);
        }

        if (Car::count() === 0) {
            $this->call(CarSeeder::class);
        }

        $customers = Customer::all();
        $finances = FinanceCompany::all();
        $cars = Car::query()->whereDoesntHave('sale')->get();

        if ($cars->isEmpty()) {
            return;
        }

        // We will seed sales for 8 cars
        $carsToSell = $cars->take(8);

        $scenarios = [
            // 1. Cash Full Lunas Langsung
            [
                'type' => 'cash_full',
                'status' => 'completed',
                'notes' => 'Penjualan tunai lunas di tempat. Surat dan unit langsung serah terima.',
            ],
            // 2. Cash Full Lunas Langsung
            [
                'type' => 'cash_full',
                'status' => 'completed',
                'notes' => 'Pembayaran full transfer via BCA, BPKB diserahkan.',
            ],
            // 3. Cash Tempo (Sudah Lunas)
            [
                'type' => 'cash_tempo',
                'status' => 'completed',
                'notes' => 'Pembayaran tempo 2 tahap. DP 30%, pelunasan 14 hari kemudian.',
            ],
            // 4. Cash Tempo (Belum Lunas / Masih Ada Piutang)
            [
                'type' => 'cash_tempo',
                'status' => 'partial',
                'notes' => 'Booking fee & DP 20% sudah masuk. Menunggu pelunasan sisa tagihan saat gajian.',
            ],
            // 5. Kredit BCA Finance (Lunas & Bonus Cair)
            [
                'type' => 'credit',
                'finance' => 'BCAF',
                'status' => 'completed',
                'bonus_received' => true,
                'notes' => 'Kredit tenor 4 tahun via BCA Finance. DP 25%, leasing cair H+5, bonus komisi showroom cair.',
            ],
            // 6. Kredit Mandiri Utama Finance (Leasing Sudah Cair, Menunggu Bonus)
            [
                'type' => 'credit',
                'finance' => 'MUF',
                'status' => 'completed',
                'bonus_received' => false,
                'notes' => 'Kredit Mandiri Utama Finance tenor 3 tahun. Pokok leasing sudah masuk rekening showroom.',
            ],
            // 7. Kredit Adira Finance (DP Masuk, Menunggu Pencairan Pokok Leasing)
            [
                'type' => 'credit',
                'finance' => 'ADIRA',
                'status' => 'partial',
                'bonus_received' => false,
                'notes' => 'DP customer sudah disetor ke kasir showroom. PO leasing sudah terbit, menunggu dana cair.',
            ],
            // 8. Cash Tempo Baru Booking
            [
                'type' => 'cash_tempo',
                'status' => 'partial',
                'notes' => 'Customer baru bayar tanda jadi (booking fee). Janji pelunasan akhir bulan.',
            ],
        ];

        foreach ($carsToSell as $idx => $car) {
            $scenario = $scenarios[$idx % count($scenarios)];
            $customer = $customers->random();
            $dealPrice = $car->selling_price ?: fake()->numberBetween(180, 650) * 1_000_000;
            $saleDate = Carbon::now()->subDays(fake()->numberBetween(10, 90));

            $paymentType = $scenario['type'];
            $status = $scenario['status'];
            $financeCompanyId = null;
            $downPayment = 0;
            $financeAmount = 0;
            $disbursementEstDate = null;
            $disbursementActualDate = null;
            $leasingBonus = 0;
            $dueDate = null;

            if ($paymentType === 'cash_full') {
                $downPayment = $dealPrice;
            } elseif ($paymentType === 'cash_tempo') {
                $downPayment = (int) ($dealPrice * ($idx === 7 ? 0.05 : 0.25)); // scenario 8 is 5% booking fee
                $dueDate = Carbon::parse($saleDate)->addDays(14)->format('Y-m-d');
            } elseif ($paymentType === 'credit') {
                $financeCode = $scenario['finance'] ?? 'BCAF';
                $financeCompany = $finances->firstWhere('code', $financeCode) ?? $finances->first();
                $financeCompanyId = $financeCompany?->id;
                $downPayment = (int) ($dealPrice * 0.20);
                $financeAmount = $dealPrice - $downPayment;
                $disbursementEstDate = Carbon::parse($saleDate)->addDays(5)->format('Y-m-d');
                $disbursementActualDate = $status === 'completed' ? Carbon::parse($saleDate)->addDays(4)->format('Y-m-d') : null;
                $leasingBonus = fake()->numberBetween(25, 50) * 100_000; // 2.5jt - 5jt
            }

            $sale = Sale::query()->create([
                'invoice_number' => Sale::generateInvoiceNumber($saleDate),
                'car_id' => $car->id,
                'customer_id' => $customer->id,
                'finance_company_id' => $financeCompanyId,
                'payment_type' => $paymentType,
                'deal_price' => $dealPrice,
                'down_payment' => $downPayment,
                'finance_amount' => $financeAmount,
                'disbursement_estimated_date' => $disbursementEstDate,
                'disbursement_actual_date' => $disbursementActualDate,
                'leasing_bonus' => $leasingBonus,
                'due_date' => $dueDate,
                'status' => $status,
                'notes' => $scenario['notes'],
                'created_at' => $saleDate,
                'updated_at' => $saleDate,
            ]);

            // Create payments according to scenario
            if ($paymentType === 'cash_full') {
                Payment::query()->create([
                    'payment_number' => Payment::generatePaymentNumber($saleDate),
                    'sale_id' => $sale->id,
                    'payment_date' => $saleDate->format('Y-m-d'),
                    'payer_type' => 'customer',
                    'payment_category' => 'settlement',
                    'amount' => $dealPrice,
                    'payment_method' => 'transfer',
                    'destination_account' => 'BCA Showroom (0123-456-789)',
                    'reference_number' => 'TRX-'.strtoupper(fake()->bothify('###???')),
                    'status' => 'confirmed',
                    'notes' => 'Pembayaran lunas via transfer bank.',
                    'created_at' => $saleDate,
                    'updated_at' => $saleDate,
                ]);
            } elseif ($paymentType === 'cash_tempo') {
                // Payment 1: DP / Booking Fee
                Payment::query()->create([
                    'payment_number' => Payment::generatePaymentNumber($saleDate),
                    'sale_id' => $sale->id,
                    'payment_date' => $saleDate->format('Y-m-d'),
                    'payer_type' => 'customer',
                    'payment_category' => $idx === 7 ? 'down_payment' : 'down_payment',
                    'amount' => $downPayment,
                    'payment_method' => 'transfer',
                    'destination_account' => 'BCA Showroom (0123-456-789)',
                    'reference_number' => 'TRX-'.strtoupper(fake()->bothify('###???')),
                    'status' => 'confirmed',
                    'notes' => 'Pembayaran uang muka / DP pertama.',
                    'created_at' => $saleDate,
                    'updated_at' => $saleDate,
                ]);

                // Payment 2: If completed, add second payment
                if ($status === 'completed') {
                    $settleDate = Carbon::parse($saleDate)->addDays(10);
                    Payment::query()->create([
                        'payment_number' => Payment::generatePaymentNumber($settleDate),
                        'sale_id' => $sale->id,
                        'payment_date' => $settleDate->format('Y-m-d'),
                        'payer_type' => 'customer',
                        'payment_category' => 'settlement',
                        'amount' => $dealPrice - $downPayment,
                        'payment_method' => 'transfer',
                        'destination_account' => 'Mandiri Showroom (1400-987-654)',
                        'reference_number' => 'TRX-'.strtoupper(fake()->bothify('###???')),
                        'status' => 'confirmed',
                        'notes' => 'Pelunasan sisa pembayaran tempo.',
                        'created_at' => $settleDate,
                        'updated_at' => $settleDate,
                    ]);
                }
            } elseif ($paymentType === 'credit') {
                // Payment 1: DP from customer
                Payment::query()->create([
                    'payment_number' => Payment::generatePaymentNumber($saleDate),
                    'sale_id' => $sale->id,
                    'payment_date' => $saleDate->format('Y-m-d'),
                    'payer_type' => 'customer',
                    'payment_category' => 'down_payment',
                    'amount' => $downPayment,
                    'payment_method' => 'transfer',
                    'destination_account' => 'BCA Showroom (0123-456-789)',
                    'reference_number' => 'TRX-'.strtoupper(fake()->bothify('###???')),
                    'status' => 'confirmed',
                    'notes' => 'Penerimaan DP customer untuk pengajuan kredit leasing.',
                    'created_at' => $saleDate,
                    'updated_at' => $saleDate,
                ]);

                // Payment 2: Disbursement from leasing if completed
                if ($status === 'completed') {
                    $disbursedDate = Carbon::parse($saleDate)->addDays(4);
                    Payment::query()->create([
                        'payment_number' => Payment::generatePaymentNumber($disbursedDate),
                        'sale_id' => $sale->id,
                        'payment_date' => $disbursedDate->format('Y-m-d'),
                        'payer_type' => 'finance',
                        'payment_category' => 'finance_disbursement',
                        'amount' => $financeAmount,
                        'payment_method' => 'transfer',
                        'destination_account' => 'BCA Showroom (0123-456-789)',
                        'reference_number' => 'TRX-'.strtoupper(fake()->bothify('###???')),
                        'status' => 'confirmed',
                        'notes' => 'Pencairan pokok pembiayaan kredit dari pihak leasing.',
                        'created_at' => $disbursedDate,
                        'updated_at' => $disbursedDate,
                    ]);

                    // Payment 3: Bonus from leasing if scenario allows
                    if (!empty($scenario['bonus_received']) && $leasingBonus > 0) {
                        $bonusDate = Carbon::parse($disbursedDate)->addDays(3);
                        Payment::query()->create([
                            'payment_number' => Payment::generatePaymentNumber($bonusDate),
                            'sale_id' => $sale->id,
                            'payment_date' => $bonusDate->format('Y-m-d'),
                            'payer_type' => 'finance',
                            'payment_category' => 'leasing_bonus',
                            'amount' => $leasingBonus,
                            'payment_method' => 'transfer',
                            'destination_account' => 'BCA Showroom (0123-456-789)',
                            'reference_number' => 'TRX-'.strtoupper(fake()->bothify('###???')),
                            'status' => 'confirmed',
                            'notes' => 'Pencairan bonus komisi / refund dealer dari pihak leasing.',
                            'created_at' => $bonusDate,
                            'updated_at' => $bonusDate,
                        ]);
                    }
                }
            }

            // Update car status accordingly
            $car->update([
                'status' => $status === 'completed' ? 'sold' : 'booked',
            ]);
        }
    }
}

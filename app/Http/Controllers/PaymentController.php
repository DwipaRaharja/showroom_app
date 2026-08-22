<?php

namespace App\Http\Controllers;

use App\Http\Requests\Payment\StorePaymentRequest;
use App\Models\Payment;
use App\Models\Sale;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class PaymentController extends Controller
{
    /**
     * Store a newly created payment for a sale.
     */
    public function store(StorePaymentRequest $request, Sale $sale): RedirectResponse
    {
        $validated = $request->validated();

        DB::transaction(function () use ($validated, $sale) {
            /** @var Sale $lockedSale */
            $lockedSale = Sale::query()
                ->lockForUpdate()
                ->findOrFail($sale->id);
            $lockedSale->load('payments');

            $category = $validated['payment_category'];
            $amount = (int) $validated['amount'];
            $isBonus = $category === 'leasing_bonus';
            $remaining = $isBonus
                ? max(0, $lockedSale->leasing_bonus - $lockedSale->total_bonus_paid)
                : $lockedSale->remaining_bill;

            if ($lockedSale->status === 'cancelled') {
                throw ValidationException::withMessages([
                    'payment_category' => 'Penjualan yang dibatalkan tidak dapat menerima pembayaran.',
                ]);
            }

            if ($category === 'down_payment' && $lockedSale->has_down_payment) {
                throw ValidationException::withMessages([
                    'payment_category' => 'Pembayaran DP / booking sudah pernah dicatat untuk penjualan ini.',
                ]);
            }

            if (
                $category === 'installment'
                && $lockedSale->payment_type === 'cash_tempo'
                && ! $lockedSale->has_down_payment
            ) {
                throw ValidationException::withMessages([
                    'payment_category' => 'Catat pembayaran DP / booking terlebih dahulu sebelum menambahkan angsuran.',
                ]);
            }

            if ($remaining <= 0) {
                throw ValidationException::withMessages([
                    'amount' => $isBonus
                        ? 'Bonus leasing sudah diterima seluruhnya.'
                        : 'Penjualan ini sudah lunas dan tidak dapat menerima pembayaran lagi.',
                ]);
            }

            if ($amount > $remaining) {
                throw ValidationException::withMessages([
                    'amount' => 'Nominal pembayaran tidak boleh melebihi sisa tagihan sebesar Rp '.number_format($remaining, 0, ',', '.').'.',
                ]);
            }

            Payment::query()->create([
                'sale_id' => $lockedSale->id,
                'payment_date' => $validated['payment_date'],
                'payer_type' => $validated['payer_type'],
                'payment_category' => $validated['payment_category'],
                'amount' => $validated['amount'],
                'payment_method' => $validated['payment_method'],
                'destination_account' => $validated['destination_account'],
                'reference_number' => $validated['reference_number'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'status' => 'confirmed',
            ]);

            // If this payment was a finance disbursement, record actual disbursement date
            if ($validated['payment_category'] === 'finance_disbursement') {
                $lockedSale->update(['disbursement_actual_date' => $validated['payment_date']]);
            }

            $lockedSale->refreshSettlementStatus();
        });

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Pembayaran berhasil dicatat.',
        ]);

        return back();
    }

    /**
     * Remove the specified payment.
     */
    public function destroy(Payment $payment): RedirectResponse
    {
        $sale = $payment->sale;

        DB::transaction(function () use ($payment, $sale) {
            $payment->delete();
            $sale?->refreshSettlementStatus();
        });

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Catatan pembayaran berhasil dihapus.',
        ]);

        return back();
    }
}

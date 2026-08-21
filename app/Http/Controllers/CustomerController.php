<?php

namespace App\Http\Controllers;

use App\Http\Requests\Customer\StoreCustomerRequest;
use App\Http\Requests\Customer\UpdateCustomerRequest;
use App\Models\Customer;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class CustomerController extends Controller
{
    /**
     * Display the customer listing.
     */
    public function index(): Response
    {
        return Inertia::render('customers/index', [
            'customers' => Customer::query()
                ->withTrashed()
                ->latest('id')
                ->get([
                    'id',
                    'name',
                    'phone',
                    'ktp_number',
                    'address',
                    'created_at',
                    'deleted_at',
                ]),
        ]);
    }

    /**
     * Store a newly created customer.
     */
    public function store(StoreCustomerRequest $request): RedirectResponse
    {
        Customer::query()->create($request->validated());

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Customer berhasil ditambahkan.',
        ]);

        return to_route('customers.index');
    }

    /**
     * Update the specified customer.
     */
    public function update(UpdateCustomerRequest $request, Customer $customer): RedirectResponse
    {
        $customer->update($request->validated());

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Customer berhasil diperbarui.',
        ]);

        return to_route('customers.index');
    }

    /**
     * Archive the specified customer.
     */
    public function destroy(Customer $customer): RedirectResponse
    {
        $customer->delete();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Customer berhasil diarsipkan.',
        ]);

        return to_route('customers.index');
    }

    /**
     * Restore an archived customer.
     */
    public function restore(int $customer): RedirectResponse
    {
        $customer = Customer::query()
            ->withTrashed()
            ->findOrFail($customer);

        $customer->restore();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Customer berhasil dipulihkan.',
        ]);

        return to_route('customers.index');
    }
}

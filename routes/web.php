<?php

use App\Http\Controllers\BrandController;
use App\Http\Controllers\CarController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\FinanceCompanyController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\SaleController;
use App\Http\Controllers\VehicleDocumentController;
use App\Http\Controllers\VehicleHandoverController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return auth()->check()
        ? redirect()->route('dashboard')
        : redirect()->route('login');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
    Route::patch('brands/{brand}/status', [BrandController::class, 'updateStatus'])
        ->name('brands.status.update');
    Route::resource('brands', BrandController::class)->only([
        'index',
        'store',
        'update',
        'destroy',
    ]);
    Route::patch('customers/{customer}/restore', [CustomerController::class, 'restore'])
        ->name('customers.restore');
    Route::resource('customers', CustomerController::class)->only([
        'index',
        'store',
        'update',
        'destroy',
    ]);
    Route::patch('finance-companies/{financeCompany}/status', [FinanceCompanyController::class, 'updateStatus'])
        ->name('finance-companies.status.update');
    Route::resource('finance-companies', FinanceCompanyController::class)->only([
        'index',
        'store',
        'update',
        'destroy',
    ]);
    Route::patch('cars/{car}/status', [CarController::class, 'updateStatus'])
        ->name('cars.status.update');
    Route::resource('cars', CarController::class)->only([
        'index',
        'create',
        'store',
        'show',
        'edit',
        'update',
        'destroy',
    ]);
    Route::post('cars/{car}/documents', [VehicleDocumentController::class, 'store'])
        ->name('vehicle-documents.store');
    Route::get('cars/{car}/documents/download', [VehicleDocumentController::class, 'download'])
        ->name('vehicle-documents.download');
    Route::resource('sales', SaleController::class)->only([
        'index',
        'create',
        'store',
        'show',
        'destroy',
    ]);
    Route::post('sales/{sale}/payments', [PaymentController::class, 'store'])
        ->name('payments.store');
    Route::delete('payments/{payment}', [PaymentController::class, 'destroy'])
        ->name('payments.destroy');
    Route::get('handovers', [VehicleHandoverController::class, 'index'])
        ->name('handovers.index');
    Route::post('handovers', [VehicleHandoverController::class, 'store'])
        ->name('handovers.store');
    Route::get('handovers/{sale}', [VehicleHandoverController::class, 'show'])
        ->name('handovers.show');
    Route::get('sales/{sale}/bast', [VehicleHandoverController::class, 'printBast'])
        ->name('sales.bast.print');
    Route::get('handovers/{handover}/proof', [VehicleHandoverController::class, 'downloadProof'])
        ->name('handovers.proof.download');
    Route::get('handover-photos/{photo}', [VehicleHandoverController::class, 'downloadPhoto'])
        ->name('handover-photos.download');
});

require __DIR__.'/settings.php';

<?php

use App\Http\Controllers\BrandController;
use App\Http\Controllers\CarController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\DocumentProcessController;
use App\Http\Controllers\DocumentProcessItemController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\PurchaseController;
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
    Route::patch('cars/{car}/status', [CarController::class, 'updateStatus'])
        ->name('cars.status.update');
    Route::resource('cars', CarController::class)->only([
        'index',
        'create',
        'store',
        'edit',
        'update',
        'destroy',
    ]);
    Route::post('cars/{car}/documents', [VehicleDocumentController::class, 'store'])
        ->name('vehicle-documents.store');
    Route::get('vehicle-documents/{vehicleDocument}/download', [VehicleDocumentController::class, 'download'])
        ->name('vehicle-documents.download');
    Route::put('vehicle-documents/{vehicleDocument}', [VehicleDocumentController::class, 'update'])
        ->name('vehicle-documents.update');
    Route::delete('vehicle-documents/{vehicleDocument}', [VehicleDocumentController::class, 'destroy'])
        ->name('vehicle-documents.destroy');
    Route::patch('purchases/{purchase}/status', [PurchaseController::class, 'updateStatus'])
        ->name('purchases.status.update');
    Route::resource('purchases', PurchaseController::class)->only([
        'index',
        'create',
        'store',
        'edit',
        'update',
        'destroy',
    ]);
    Route::resource('sales', SaleController::class)->only([
        'index',
        'create',
        'store',
        'show',
        'destroy',
    ]);
    Route::get('document-processes', [DocumentProcessController::class, 'index'])
        ->name('document-processes.index');
    Route::get('sales/{sale}/document-process/create', [DocumentProcessController::class, 'create'])
        ->name('document-processes.create');
    Route::post('sales/{sale}/document-process', [DocumentProcessController::class, 'store'])
        ->name('document-processes.store');
    Route::get('document-processes/{documentProcess}', [DocumentProcessController::class, 'show'])
        ->name('document-processes.show');
    Route::put('document-processes/{documentProcess}', [DocumentProcessController::class, 'update'])
        ->name('document-processes.update');
    Route::patch('document-processes/{documentProcess}/cancel', [DocumentProcessController::class, 'cancel'])
        ->name('document-processes.cancel');
    Route::patch('document-processes/{documentProcess}/reopen', [DocumentProcessController::class, 'reopen'])
        ->name('document-processes.reopen');
    Route::put('document-process-items/{documentProcessItem}', [DocumentProcessItemController::class, 'update'])
        ->name('document-process-items.update');
    Route::post('sales/{sale}/payments', [PaymentController::class, 'store'])
        ->name('payments.store');
    Route::delete('payments/{payment}', [PaymentController::class, 'destroy'])
        ->name('payments.destroy');
    Route::post('handovers', [VehicleHandoverController::class, 'store'])
        ->name('handovers.store');
    Route::get('sales/{sale}/bast', [VehicleHandoverController::class, 'printBast'])
        ->name('sales.bast.print');
    Route::delete('handovers/{handover}', [VehicleHandoverController::class, 'destroy'])
        ->name('handovers.destroy');
});

require __DIR__.'/settings.php';

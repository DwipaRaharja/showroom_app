<?php

use App\Http\Controllers\BrandController;
use App\Http\Controllers\CarController;
use App\Http\Controllers\CustomerController;
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
        'store',
        'update',
        'destroy',
    ]);
});

require __DIR__.'/settings.php';

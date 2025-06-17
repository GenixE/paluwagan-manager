<?php

use App\Http\Controllers\ClientController;
use App\Http\Controllers\ContributionController;
use App\Http\Controllers\CycleController;
use App\Http\Controllers\GroupController;
use App\Http\Controllers\GroupMemberController;
use App\Http\Controllers\PayoutController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    // Client CRUD
    Route::prefix('clients')->name('clients.')->group(function () {
        Route::get('/', [ClientController::class, 'index'])->name('index');
        Route::get('create', [ClientController::class, 'create'])->name('create');
        Route::post('/', [ClientController::class, 'store'])->name('store');
        Route::get('{client}', [ClientController::class, 'show'])->name('show');
        Route::get('{client}/edit', [ClientController::class, 'edit'])->name('edit');
        Route::put('{client}', [ClientController::class, 'update'])->name('update');
        Route::delete('{client}', [ClientController::class, 'destroy'])->name('destroy');
    });

    // Payouts (Global List)
    Route::get('payouts', [PayoutController::class, 'index'])->name('payouts.index');

    // Contributions (Global List)
    Route::get('contributions', [ContributionController::class, 'allContributions'])->name('contributions.index');

    // Group CRUD + lifecycle routes
    Route::prefix('groups')->name('groups.')->group(function () {
        Route::get('/', [GroupController::class, 'index'])->name('index');
        Route::post('/', [GroupController::class, 'store'])->name('store');
        Route::get('{group}', [GroupController::class, 'show'])->name('show');
        Route::put('{group}', [GroupController::class, 'update'])->name('update');
        Route::delete('{group}', [GroupController::class, 'destroy'])->name('destroy');

        Route::get('{group}/members', [GroupMemberController::class, 'index'])->name('members.index');
        Route::post('{group}/members', [GroupMemberController::class, 'store'])->name('members.store');
        Route::delete('{group}/members/{member}', [GroupMemberController::class, 'destroy'])->name('members.destroy');
        Route::put('{group}/members/{member}', [GroupMemberController::class, 'update'])->name('members.update');

        Route::prefix('{group}/cycles')->name('cycles.')->group(function () { // Removed {cycle} from this prefix for store/index of cycles
            Route::post('/', [CycleController::class, 'store'])->name('store');
            Route::get('/', [CycleController::class, 'indexForGroup'])->name('index'); // Assuming indexForGroup lists cycles for a group

            Route::prefix('{cycle}')->group(function () { // New prefix for specific cycle operations
                Route::get('/', [CycleController::class, 'show'])->name('show');
                Route::put('/', [CycleController::class, 'update'])->name('update');
                Route::delete('/', [CycleController::class, 'destroy'])->name('destroy');

                // Contribution routes within a specific cycle
                Route::get('contributions', [ContributionController::class, 'indexForCycle'])->name('contributions.index');
                Route::post('contributions', [ContributionController::class, 'store'])->name('contributions.store');
                Route::patch('contributions/{contribution}', [ContributionController::class, 'update'])->name('contributions.update');
                Route::delete('contributions/{contribution}', [ContributionController::class, 'destroy'])->name('contributions.destroy');

                // Payout routes within a specific cycle
                Route::get('payouts', [PayoutController::class, 'indexForCycle'])->name('payouts.index');
                Route::post('payouts', [PayoutController::class, 'store'])->name('payouts.store');
                Route::patch('payouts/{payout}', [PayoutController::class, 'update'])->name('payouts.update'); // Changed updateStatus to update
                Route::delete('payouts/{payout}', [PayoutController::class, 'destroy'])->name('payouts.destroy'); // Added delete route
            });
        });
    });
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';

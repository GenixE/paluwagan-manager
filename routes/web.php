<?php

use App\Http\Controllers\ClientController;
use App\Http\Controllers\ContributionController;
use App\Http\Controllers\CycleController;
use App\Http\Controllers\GroupController;
use App\Http\Controllers\GroupMemberController;
use App\Http\Controllers\GroupTerminationController;
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
    Route::prefix('clients')->group(function () {
        Route::get('/', [ClientController::class, 'index'])->name('clients.index');
        Route::post('/', [ClientController::class, 'store'])->name('clients.store');
        Route::get('{client}', [ClientController::class, 'show'])->name('clients.show');
        Route::put('{client}', [ClientController::class, 'update'])->name('clients.update');
        Route::delete('{client}', [ClientController::class, 'destroy'])->name('clients.destroy');
    });

    // Group CRUD + lifecycle routes
    Route::prefix('groups')->group(function () {
        Route::get('/', [GroupController::class, 'index'])->name('groups.index');
        Route::post('/', [GroupController::class, 'store'])->name('groups.store');
        Route::get('{group}', [GroupController::class, 'show'])->name('groups.show');
        Route::put('{group}', [GroupController::class, 'update'])->name('groups.update');

        // Manual termination
        Route::post('{group}/terminate', [GroupController::class, 'terminate'])->name('groups.terminate');

        // Membership
        Route::get('{group}/members', [GroupMemberController::class, 'index'])->name('groups.members.index');
        Route::post('{group}/members', [GroupMemberController::class, 'store'])->name('groups.members.store');
        Route::delete('{group}/members/{member}', [GroupMemberController::class, 'destroy'])->name('groups.members.destroy');

        // Terminations log
        Route::get('{group}/terminations', [GroupTerminationController::class, 'index'])->name('groups.terminations.index');
        Route::post('{group}/terminations', [GroupTerminationController::class, 'store'])->name('groups.terminations.store');

        // Nested: Cycles
        Route::prefix('{group}/cycles')->group(function () {
            Route::get('/', [CycleController::class, 'index'])->name('groups.cycles.index');
            Route::post('/', [CycleController::class, 'store'])->name('groups.cycles.store');
            Route::get('{cycle}', [CycleController::class, 'show'])->name('groups.cycles.show');
            Route::put('{cycle}', [CycleController::class, 'update'])->name('groups.cycles.update');
            Route::delete('{cycle}', [CycleController::class, 'destroy'])->name('groups.cycles.destroy');

            // Contributions
            Route::get('{cycle}/contributions', [ContributionController::class, 'index'])->name('cycles.contributions.index');
            Route::patch('{cycle}/contributions/{contribution}', [ContributionController::class, 'updateStatus'])->name('cycles.contributions.update');

            // Payouts
            Route::get('{cycle}/payouts', [PayoutController::class, 'index'])->name('cycles.payouts.index');
            Route::post('{cycle}/payouts', [PayoutController::class, 'store'])->name('cycles.payouts.store');
            Route::patch('{cycle}/payouts/{payout}', [PayoutController::class, 'updateStatus'])->name('cycles.payouts.update');
        });
    });
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';

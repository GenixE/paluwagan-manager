<?php

namespace App\Http\Controllers;

use App\Models\Group;
use App\Models\GroupMember;
use App\Models\Cycle;
use App\Models\Payout;
use App\Models\Contribution;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Illuminate\Support\Facades\DB; // If needed for complex queries, not used in this version

class DashboardController extends Controller
{
    public function index(): InertiaResponse
    {
        // Summary Cards Data
        $totalMembers = GroupMember::count();
        $activeGroups = Group::where('status', 'active')->count(); // Ensure 'active' is a valid status in your Group model
        $pendingPayoutsValue = Payout::where('status', 'scheduled')->sum('amount');

        $summaryCardsData = [
            ['title' => 'Total Members', 'value' => $totalMembers],
            ['title' => 'Active Groups', 'value' => $activeGroups],
            ['title' => 'Pending Payouts', 'value' => '€' . number_format($pendingPayoutsValue ?? 0, 2)],
        ];

        // Cycle & Payout Tracker Data
        $activeDbCycles = Cycle::where('status', 'active')
            ->with('group') // Eager load group for cycle name
            ->withSum('contributions', 'amount') // Eager load sum of contributions
            ->orderBy('start_date', 'desc')
            ->limit(5) // Limit for dashboard display
            ->get();

        $activeCycles = $activeDbCycles->map(function ($cycle) {
            $totalPot = $cycle->contributions_sum_amount ?? 0;
            return [
                'id' => $cycle->cycle_id,
                'name' => $cycle->group ? "Cycle {$cycle->cycle_number} - {$cycle->group->name}" : "Cycle {$cycle->cycle_number}",
                'status' => $cycle->status,
                'startDate' => $cycle->start_date ? $cycle->start_date->format('Y-m-d') : 'N/A',
                'endDate' => $cycle->end_date ? $cycle->end_date->format('Y-m-d') : 'N/A',
                'totalPot' => '€' . number_format($totalPot, 2),
            ];
        });

        $upcomingDbPayouts = Payout::where('status', 'scheduled')
            ->with(['member.client', 'cycle']) // Eager load member, client, and cycle
            ->orderByDesc('payout_id') // Or another relevant date field if 'due_date' is not present
            ->limit(5) // Limit for dashboard display
            ->get();

        $upcomingPayouts = $upcomingDbPayouts->map(function ($payout) {
            // Assuming 'due_date' is not a direct field on Payout model.
            // Use cycle's end_date or another relevant date as a placeholder.
            $dueDate = 'N/A';
            if ($payout->cycle && $payout->cycle->end_date) {
                $dueDate = $payout->cycle->end_date->format('Y-m-d');
            }
            // If you have a specific due_date logic or field, implement it here.

            return [
                'id' => $payout->payout_id,
                'memberName' => $payout->member && $payout->member->client ? $payout->member->client->name : 'Member N/A',
                'amount' => '€' . number_format($payout->amount ?? 0, 2),
                'dueDate' => $dueDate,
                'status' => $payout->status,
            ];
        });

        // Member Health Snapshot Data
        $overdueContributionsCount = Contribution::where('status', 'missed')->count();
        // engagementRate is conceptual, this is a placeholder
        $memberHealthData = [
            'overdueContributions' => $overdueContributionsCount,
            'engagementRate' => 75, // Example placeholder value
        ];

        return Inertia::render('dashboard', [
            'summaryCardsData' => $summaryCardsData,
            'cycleTrackerData' => [
                'activeCycles' => $activeCycles,
                'upcomingPayouts' => $upcomingPayouts,
            ],
            'memberHealthData' => $memberHealthData,
        ]);
    }
}

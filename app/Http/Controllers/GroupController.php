<?php

namespace App\Http\Controllers;

use App\Models\Group;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Symfony\Component\HttpFoundation\Response as HttpStatus;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse; // Ensure this is imported

class GroupController extends Controller
{
    public function index(Request $request): InertiaResponse
    {
        $query = Group::query()->withCount('members');

        if ($request->has('status')) {
            $query->where('status', $request->query('status'));
        }

        return Inertia::render('group', [
            'groups' => $query->get()->map(fn($group) => [
                'group_id' => $group->group_id,
                'name' => $group->name,
                'description' => $group->description,
                'current_cycle' => $group->current_cycle,
                'status' => $group->status,
                'created_at' => $group->created_at ? Carbon::parse($group->created_at)->toDateString() : null,
                'status_changed_at' => $group->status_changed_at ? Carbon::parse($group->status_changed_at)->toDateString() : null,
                'members_count' => $group->members_count,
            ]),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:150',
            'description' => 'nullable|string',
        ]);

        Group::create($data);

        return redirect()->route('groups.index')->with('success', 'Group created successfully.');
    }

    public function show($id): InertiaResponse
    {
        $group = Group::with([
            'members.client',
            'cycles' => function ($query) {
                $query->with(['contributions.member.client', 'payouts.member.client'])
                    ->orderBy('cycle_number', 'asc');
            }
        ])->findOrFail($id);

        // Determine the latest cycle number from the loaded cycles
        $latestCycleNumber = null;
        if ($group->cycles->isNotEmpty()) {
            $latestCycle = $group->cycles->last(); // Get the last cycle (latest due to ordering)
            if ($latestCycle) {
                $latestCycleNumber = $latestCycle->cycle_number;
            }
        }

        $groupData = [
            'group_id' => $group->group_id,
            'name' => $group->name,
            'description' => $group->description,
            'current_cycle' => $latestCycleNumber, // Use the dynamically determined latest cycle number
            'status' => $group->status,
            'created_at' => $group->created_at ? Carbon::parse($group->created_at)->toDateTimeString() : null,
            'status_changed_at' => $group->status_changed_at ? Carbon::parse($group->status_changed_at)->toDateTimeString() : null,
            'members' => $group->members->map(function ($member) {
                return [
                    'client' => [
                        'client_id' => $member->client->client_id,
                        'first_name' => $member->client->first_name,
                        'last_name' => $member->client->last_name,
                        'email' => $member->client->email,
                        'phone' => $member->client->phone,
                    ],
                    'pivot' => [
                        'joined_at' => $member->joined_at ? Carbon::parse($member->joined_at)->toDateTimeString() : null,
                        'position' => $member->position, // Added position attribute
                    ]
                ];
            }),
            'cycles' => $group->cycles->map(function ($cycle) {
                $contributions = $cycle->contributions->map(function ($contribution) {
                    return [
                        'contribution_id' => $contribution->contribution_id,
                        'member_name' => $contribution->member && $contribution->member->client ? $contribution->member->client->first_name . ' ' . $contribution->member->client->last_name : 'N/A',
                        'amount' => $contribution->amount,
                        'status' => $contribution->status,
                        'contribution_date' => $contribution->paid_at ? Carbon::parse($contribution->paid_at)->toDateString() : ($contribution->created_at ? Carbon::parse($contribution->created_at)->toDateString() : null),
                    ];
                });

                $totalContributionAmount = $contributions->sum('amount');

                return [
                    'cycle_id' => $cycle->cycle_id,
                    'cycle_number' => $cycle->cycle_number,
                    'start_date' => $cycle->start_date ? Carbon::parse($cycle->start_date)->toDateString() : null,
                    'end_date' => $cycle->end_date ? Carbon::parse($cycle->end_date)->toDateString() : null,
                    'status' => $cycle->status,
                    'contribution_amount' => $totalContributionAmount, // Calculated sum
                    'contributions' => $contributions,
                    'payouts' => $cycle->payouts->map(function ($payout) {
                        return [
                            'payout_id' => $payout->payout_id,
                            'member_name' => $payout->member && $payout->member->client ? $payout->member->client->first_name . ' ' . $payout->member->client->last_name : 'N/A',
                            'amount' => $payout->amount,
                            'status' => $payout->status,
                            'payout_date' => $payout->paid_at ? Carbon::parse($payout->paid_at)->toDateString() : null,
                        ];
                    }),
                ];
            }),
        ];

        return Inertia::render('group-details', [
            'group' => $groupData,
        ]);
    }

    public function update(Request $request, $id): RedirectResponse
    {
        $group = Group::findOrFail($id);
        $data = $request->validate([
            'name' => 'sometimes|required|string|max:150',
            'description' => 'nullable|string',
            'current_cycle' => 'sometimes|nullable|integer|min:1', // Allow updating current_cycle
            'status' => 'sometimes|required|in:active,finished,pending', // Allow updating group status
        ]);

        // status_changed_at is handled by the Group model's mutator if status changes

        $group->update($data);
        return redirect()->back()->with('success', 'Group updated successfully.');
    }

    public function destroy($id): RedirectResponse
    {
        $group = Group::findOrFail($id);
        $group->delete();
        return redirect()->route('groups.index')->with('success', 'Group deleted successfully.');
    }
}

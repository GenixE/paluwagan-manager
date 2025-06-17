<?php

namespace App\Http\Controllers;

use App\Models\Contribution;
use App\Models\Cycle;
use App\Models\Group;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse; // Import RedirectResponse
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse; // Import InertiaResponse for type hinting
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException; // Import ValidationException

class ContributionController extends Controller
{
    // Method to fetch contributions for a specific cycle
    public function indexForCycle(Group $group, Cycle $cycle): InertiaResponse | RedirectResponse
    {
        // Ensure the cycle belongs to the group
        if ($cycle->group_id !== $group->group_id) {
            return redirect()->back()->withErrors(['message' => 'Cycle not found in this group.']);
        }
        $contributions = Contribution::with('member.client')
            ->where('cycle_id', $cycle->cycle_id)
            ->get();

        return Inertia::render('Contributions/IndexForCycle', [ // Assuming a view like 'Contributions/IndexForCycle'
            'group' => $group,
            'cycle' => $cycle,
            'contributions' => $contributions,
        ]);
    }

    // New method to fetch all contributions (global list)
    public function allContributions(): InertiaResponse
    {
        $contributions = Contribution::with(['member.client', 'cycle.group'])
            ->orderByRaw('ISNULL(paid_at) ASC, paid_at DESC')
            ->get();

        return Inertia::render('contribution', [ // Changed view to 'contribution'
            'contributions' => $contributions,
        ]);
    }

    public function store(Request $request, Group $group, Cycle $cycle): RedirectResponse
    {
        if ($cycle->group_id !== $group->group_id) {
            return redirect()->back()->withErrors(['message' => 'Cycle not found in this group.']);
        }

        $validatedData = $request->validate([
            'member_id' => [
                'required',
                Rule::exists('group_members', 'member_id')->where(function ($query) use ($group) {
                    return $query->where('group_id', $group->group_id);
                }),
            ],
            'amount' => 'required|numeric|min:0',
            'status' => 'required|in:pending,paid,missed',
            'notes' => 'nullable|string|max:1000',
        ]);

        $cycle->contributions()->create([
            'member_id' => $validatedData['member_id'],
            'amount' => $validatedData['amount'],
            'status' => $validatedData['status'],
            'notes' => $validatedData['notes'] ?? null,
            'paid_at' => ($validatedData['status'] === 'paid') ? now() : null,
        ]);

        return redirect()->back()->with('success', 'Contribution added successfully.');
    }

    public function update(Request $request, Group $group, Cycle $cycle, Contribution $contribution): RedirectResponse
    {
        if ($cycle->group_id !== $group->group_id || $contribution->cycle_id !== $cycle->cycle_id) {
            return redirect()->back()->withErrors(['message' => 'Resource not found or access denied.']);
        }

        $validatedData = $request->validate([
            'amount' => 'sometimes|required|numeric|min:0',
            'status' => 'sometimes|required|in:pending,paid,missed',
            'notes' => 'nullable|string|max:1000',
        ]);

        if (isset($validatedData['status'])) {
            if ($validatedData['status'] === 'paid' && $contribution->status !== 'paid') {
                $validatedData['paid_at'] = now();
            } elseif ($validatedData['status'] !== 'paid' && $contribution->status === 'paid') {
                $validatedData['paid_at'] = null;
            } else if ($validatedData['status'] === 'paid') {
                $validatedData['paid_at'] = $contribution->paid_at ?? now();
            } else {
                $validatedData['paid_at'] = null;
            }
        }

        $contribution->update($validatedData);

        return redirect()->back()->with('success', 'Contribution updated successfully.');
    }

    public function destroy(Group $group, Cycle $cycle, Contribution $contribution): RedirectResponse
    {
        if ($cycle->group_id !== $group->group_id || $contribution->cycle_id !== $cycle->cycle_id) {
            return redirect()->back()->withErrors(['message' => 'Resource not found or access denied.']);
        }

        $contribution->delete();

        return redirect()->back()->with('success', 'Contribution removed successfully.');
    }
}

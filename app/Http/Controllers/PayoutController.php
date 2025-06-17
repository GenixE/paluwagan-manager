<?php

namespace App\Http\Controllers;

use App\Models\Cycle;
use App\Models\Group;
use App\Models\Payout;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse; // Import RedirectResponse
use Inertia\Inertia;
use Inertia\Response as InertiaResponse; // Import InertiaResponse for type hinting
use Illuminate\Support\Facades\Validator; // Keep for direct use if preferred, or remove if fully switching to $request->validate()
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException; // Import ValidationException

class PayoutController extends Controller
{
    public function index(): InertiaResponse
    {
        $payouts = Payout::with(['member.client', 'cycle.group'])
            ->orderByRaw('ISNULL(paid_at) ASC, paid_at DESC')
            ->get();

        return Inertia::render('payout', [ // Assuming a view like 'Payouts/Index'
            'payouts' => $payouts,
        ]);
    }

    // Method to fetch payouts for a specific cycle
    public function indexForCycle(Group $group, Cycle $cycle): InertiaResponse | RedirectResponse
    {
        // Ensure the cycle belongs to the group
        if ($cycle->group_id !== $group->group_id) {
            return redirect()->back()->withErrors(['message' => 'Cycle not found in this group.']);
        }
        $payouts = Payout::with('member.client')
            ->where('cycle_id', $cycle->cycle_id)
            ->orderByRaw('ISNULL(paid_at) ASC, paid_at DESC')
            ->get();

        return Inertia::render('Payouts/IndexForCycle', [ // Assuming a view like 'Payouts/IndexForCycle'
            'group' => $group,
            'cycle' => $cycle,
            'payouts' => $payouts,
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
            'status' => 'required|in:scheduled,completed,failed',
        ]);

        $cycle->payouts()->create([
            'member_id' => $validatedData['member_id'],
            'amount' => $validatedData['amount'],
            'status' => $validatedData['status'],
            'paid_at' => ($validatedData['status'] === 'completed') ? now() : null,
        ]);

        return redirect()->back()->with('success', 'Payout created successfully.');
    }

    public function update(Request $request, Group $group, Cycle $cycle, Payout $payout): RedirectResponse
    {
        if ($cycle->group_id !== $group->group_id || $payout->cycle_id !== $cycle->cycle_id) {
            return redirect()->back()->withErrors(['message' => 'Resource not found or access denied.']);
        }

        $validatedData = $request->validate([
            'amount' => 'sometimes|required|numeric|min:0',
            'status' => 'sometimes|required|in:scheduled,completed,failed',
        ]);

        // Handle paid_at logic based on status change
        if (isset($validatedData['status'])) {
            if ($validatedData['status'] === 'completed' && $payout->status !== 'completed') {
                $validatedData['paid_at'] = now();
            } elseif ($validatedData['status'] !== 'completed' && $payout->status === 'completed') {
                $validatedData['paid_at'] = null;
            } else if ($validatedData['status'] === 'completed') {
                $validatedData['paid_at'] = $payout->paid_at ?? now();
            } else {
                $validatedData['paid_at'] = null;
            }
        }

        $payout->update($validatedData);

        return redirect()->back()->with('success', 'Payout updated successfully.');
    }

    public function destroy(Group $group, Cycle $cycle, Payout $payout): RedirectResponse
    {
        if ($cycle->group_id !== $group->group_id || $payout->cycle_id !== $cycle->cycle_id) {
            return redirect()->back()->withErrors(['message' => 'Resource not found or access denied.']);
        }

        $payout->delete();

        return redirect()->back()->with('success', 'Payout removed successfully.');
    }
}

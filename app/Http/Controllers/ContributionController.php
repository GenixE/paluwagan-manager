<?php

namespace App\Http\Controllers;

use App\Models\Contribution;
use Illuminate\Http\Request;
use Inertia\Inertia; // Make sure Inertia is imported

class ContributionController extends Controller
{
    // Method to fetch contributions for a specific cycle (existing)
    public function index($cycleId)
    {
        $contributions = Contribution::with('member.client')->where('cycle_id', $cycleId)->get();
        return response()->json($contributions);
    }

    // New method to fetch all contributions
    public function allContributions()
    {
        $contributions = Contribution::with(['member.client', 'cycle.group'])
            ->orderByRaw('ISNULL(paid_at) ASC, paid_at DESC') // Sort by paid_at descending, nulls last or first based on preference
            ->get();

        return Inertia::render('contribution', [
            'contributions' => $contributions,
        ]);
    }

    public function updateStatus(Request $request, $cycleId, $id)
    {
        $contrib = Contribution::where('cycle_id', $cycleId)->findOrFail($id);
        $data = $request->validate(['status' => 'required|in:pending,paid,missed']);
        $contrib->update(array_merge($data, ['paid_at' => $data['status']=='paid' ? now() : null]));
        return response()->json($contrib);
    }
}

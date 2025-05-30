<?php

namespace App\Http\Controllers;

use App\Models\Contribution;
use Illuminate\Http\Request;

class ContributionController extends Controller
{
    public function index($cycleId)
    {
        $contributions = Contribution::with('member.client')->where('cycle_id', $cycleId)->get();
        return response()->json($contributions);
    }

    public function updateStatus(Request $request, $cycleId, $id)
    {
        $contrib = Contribution::where('cycle_id', $cycleId)->findOrFail($id);
        $data = $request->validate(['status' => 'required|in:pending,paid,missed']);
        $contrib->update(array_merge($data, ['paid_at' => $data['status']=='paid' ? now() : null]));
        return response()->json($contrib);
    }
}

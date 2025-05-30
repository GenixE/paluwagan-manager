<?php

namespace App\Http\Controllers;

use App\Models\Payout;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class PayoutController extends Controller
{
    public function index($cycleId)
    {
        $payouts = Payout::with('member.client')->where('cycle_id', $cycleId)->get();
        return response()->json($payouts);
    }

    public function store(Request $request, $cycleId)
    {
        $data = $request->validate([
            'member_id' => 'required|exists:group_members,member_id',
            'amount'    => 'required|numeric|min:0',
        ]);
        $data['cycle_id'] = $cycleId;
        $payout = Payout::create($data);
        return response()->json($payout, Response::HTTP_CREATED);
    }

    public function updateStatus(Request $request, $cycleId, $id)
    {
        $payout = Payout::where('cycle_id', $cycleId)->findOrFail($id);
        $data = $request->validate(['status' => 'required|in:scheduled,completed,failed']);
        $payout->update(array_merge($data, ['paid_at' => $data['status']=='completed' ? now() : null]));
        return response()->json($payout);
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\Cycle;
use App\Models\Group;
use App\Models\Payout;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class PayoutController extends Controller
{
    public function index()
    {
        $payouts = Payout::with(['member.client', 'cycle.group'])
            ->orderByRaw('ISNULL(paid_at) ASC, paid_at DESC, created_at DESC')
            ->get();

        return Inertia::render('payout', [
            'payouts' => $payouts,
        ]);
    }

    // Method to fetch payouts for a specific cycle
    public function indexForCycle(Group $group, Cycle $cycle): JsonResponse
    {
        // Ensure the cycle belongs to the group
        if ($cycle->group_id !== $group->group_id) {
            return response()->json(['message' => 'Cycle not found in this group.'], Response::HTTP_NOT_FOUND);
        }
        $payouts = Payout::with('member.client')
            ->where('cycle_id', $cycle->cycle_id)
            ->orderByRaw('ISNULL(paid_at) ASC, paid_at DESC, created_at DESC')
            ->get();
        return response()->json($payouts);
    }

    public function store(Request $request, Group $group, Cycle $cycle): JsonResponse
    {
        if ($cycle->group_id !== $group->group_id) {
            return response()->json(['message' => 'Cycle not found in this group.'], Response::HTTP_FORBIDDEN);
        }

        $validator = Validator::make($request->all(), [
            'member_id' => [
                'required',
                Rule::exists('group_members', 'member_id')->where(function ($query) use ($group) {
                    return $query->where('group_id', $group->group_id);
                }),
            ],
            'amount' => 'required|numeric|min:0',
            'status' => 'required|in:scheduled,completed,failed',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $validatedData = $validator->validated();

        $payout = $cycle->payouts()->create([
            'member_id' => $validatedData['member_id'],
            'amount' => $validatedData['amount'],
            'status' => $validatedData['status'],
            'paid_at' => ($validatedData['status'] === 'completed') ? now() : null,
        ]);

        return response()->json($payout->load('member.client'), Response::HTTP_CREATED);
    }

    public function update(Request $request, Group $group, Cycle $cycle, Payout $payout): JsonResponse
    {
        if ($cycle->group_id !== $group->group_id || $payout->cycle_id !== $cycle->cycle_id) {
            return response()->json(['message' => 'Resource not found or access denied.'], Response::HTTP_FORBIDDEN);
        }

        $validator = Validator::make($request->all(), [
            'amount' => 'sometimes|required|numeric|min:0',
            'status' => 'sometimes|required|in:scheduled,completed,failed',
            // member_id is typically not updatable for a payout, but if it were:
            // 'member_id' => [
            //     'sometimes',
            //     'required',
            //     Rule::exists('group_members', 'member_id')->where(function ($query) use ($group) {
            //         return $query->where('group_id', $group->group_id);
            //     }),
            // ],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $validatedData = $validator->validated();

        // Handle paid_at logic based on status change
        if (isset($validatedData['status'])) {
            if ($validatedData['status'] === 'completed' && $payout->status !== 'completed') {
                $validatedData['paid_at'] = now();
            } elseif ($validatedData['status'] !== 'completed' && $payout->status === 'completed') {
                // If changing from completed to something else, nullify paid_at
                $validatedData['paid_at'] = null;
            } else if ($validatedData['status'] === 'completed') {
                // If status is 'completed' and was already 'completed', keep existing paid_at or set to now() if null
                $validatedData['paid_at'] = $payout->paid_at ?? now();
            } else {
                // If new status is not 'completed', ensure paid_at is null
                $validatedData['paid_at'] = null;
            }
        }

        $payout->update($validatedData);

        return response()->json($payout->load('member.client'));
    }

    public function destroy(Group $group, Cycle $cycle, Payout $payout): JsonResponse
    {
        if ($cycle->group_id !== $group->group_id || $payout->cycle_id !== $cycle->cycle_id) {
            return response()->json(['message' => 'Resource not found or access denied.'], Response::HTTP_FORBIDDEN);
        }

        $payout->delete();

        return response()->json(null, Response::HTTP_NO_CONTENT);
    }
}

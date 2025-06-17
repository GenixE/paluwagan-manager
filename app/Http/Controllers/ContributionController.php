<?php

namespace App\Http\Controllers;

use App\Models\Contribution;
use App\Models\Cycle;
use App\Models\Group;
// use App\Models\GroupMember; // Not strictly needed here if using validated IDs
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Validation\Rule;

class ContributionController extends Controller
{
    // Method to fetch contributions for a specific cycle
    public function indexForCycle(Group $group, Cycle $cycle): JsonResponse
    {
        // Ensure the cycle belongs to the group
        if ($cycle->group_id !== $group->group_id) {
            return response()->json(['message' => 'Cycle not found in this group.'], Response::HTTP_NOT_FOUND);
        }
        $contributions = Contribution::with('member.client')
            ->where('cycle_id', $cycle->cycle_id)
            ->get();
        return response()->json($contributions);
    }

    // New method to fetch all contributions (global list)
    public function allContributions()
    {
        $contributions = Contribution::with(['member.client', 'cycle.group'])
            ->orderByRaw('ISNULL(paid_at) ASC, paid_at DESC')
            ->get();

        return Inertia::render('contribution', [
            'contributions' => $contributions,
        ]);
    }

    public function store(Request $request, Group $group, Cycle $cycle): JsonResponse
    {
        if ($cycle->group_id !== $group->group_id) {
            return response()->json(['message' => 'Cycle not found in this group.'], Response::HTTP_FORBIDDEN);
        }

        $validator = Validator::make($request->all(), [
            'member_id' => [
                'required',
                // Assuming 'member_id' is the primary key of 'group_members' table
                // and that it correctly identifies a member within the given group.
                Rule::exists('group_members', 'member_id')->where(function ($query) use ($group) {
                    return $query->where('group_id', $group->group_id);
                }),
            ],
            'amount' => 'required|numeric|min:0',
            'status' => 'required|in:pending,paid,missed',
            'notes' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $validatedData = $validator->validated();

        $contribution = $cycle->contributions()->create([
            // Changed 'group_member_id' to 'member_id'
            'member_id' => $validatedData['member_id'],
            'amount' => $validatedData['amount'],
            'status' => $validatedData['status'],
            'notes' => $validatedData['notes'] ?? null,
            'paid_at' => ($validatedData['status'] === 'paid') ? now() : null,
        ]);

        return response()->json($contribution->load('member.client'), Response::HTTP_CREATED);
    }

    public function update(Request $request, Group $group, Cycle $cycle, Contribution $contribution): JsonResponse
    {
        if ($cycle->group_id !== $group->group_id || $contribution->cycle_id !== $cycle->cycle_id) {
            return response()->json(['message' => 'Resource not found or access denied.'], Response::HTTP_FORBIDDEN);
        }

        $validator = Validator::make($request->all(), [
            'amount' => 'sometimes|required|numeric|min:0',
            'status' => 'sometimes|required|in:pending,paid,missed',
            'notes' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $validatedData = $validator->validated();

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

        return response()->json($contribution->load('member.client'));
    }

    public function destroy(Group $group, Cycle $cycle, Contribution $contribution): JsonResponse
    {
        if ($cycle->group_id !== $group->group_id || $contribution->cycle_id !== $cycle->cycle_id) {
            return response()->json(['message' => 'Resource not found or access denied.'], Response::HTTP_FORBIDDEN);
        }

        $contribution->delete();

        return response()->json(null, Response::HTTP_NO_CONTENT);
    }
}

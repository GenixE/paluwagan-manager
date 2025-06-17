<?php

namespace App\Http\Controllers;

use App\Models\Group;

// Import the Group model
use App\Models\GroupMember;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Validation\ValidationException;
use Illuminate\Http\RedirectResponse; // Add this

// Import ValidationException

class GroupMemberController extends Controller
{
    public function index($groupId)
    {
        $members = GroupMember::with('client')->where('group_id', $groupId)->get();
        return response()->json($members);
    }

    public function update(Request $request, $groupId, $memberId): RedirectResponse
    {
        $member = GroupMember::where('group_id', $groupId)->findOrFail($memberId);

        $data = $request->validate([
            'position' => 'required|integer|min:1',
        ]);

        // Check if position is already taken by another member in the same group
        $existingPosition = GroupMember::where('group_id', $groupId)
            ->where('position', $data['position'])
            ->where('member_id', '!=', $memberId) // Exclude the current member
            ->first();

        if ($existingPosition) {
            throw ValidationException::withMessages([
                'position' => ['This position is already taken by another member in this group.'],
            ]);
        }

        $member->update($data);

        return redirect()->back()->with('success', 'Member position updated successfully.');
    }
    public function store(Request $request, $groupId)
    {
        $group = Group::withCount('members')->findOrFail($groupId); // Fetch group and count members

        if ($group->members_count >= 16) {
            // Throw a validation exception if the group is full
            throw ValidationException::withMessages([
                'group_id' => ['This group has reached its maximum capacity of 16 members.'],
            ]);
        }

        $data = $request->validate(
            ['client_id' => 'required|exists:clients,client_id',
                'position' => 'required|integer|min:1']
        );
        $data['group_id'] = $groupId;

        // Ensure a client is not added twice to the same group (database unique constraint should also handle this)
        $existingMember = GroupMember::where('group_id', $groupId)
            ->where('client_id', $data['client_id'])
            ->first();

        if ($existingMember) {
            throw ValidationException::withMessages([
                'client_id' => ['This client is already a member of this group.'],
            ]);
        }

        $member = GroupMember::create($data);
        return response()->json($member, Response::HTTP_CREATED);
    }

    public function destroy($groupId, $id)
    {
        $member = GroupMember::where('group_id', $groupId)->findOrFail($id);
        $member->delete();
        return response()->json(null, Response::HTTP_NO_CONTENT);
    }
}

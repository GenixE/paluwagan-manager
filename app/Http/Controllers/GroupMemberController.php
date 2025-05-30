<?php

namespace App\Http\Controllers;

use App\Models\GroupMember;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class GroupMemberController extends Controller
{
    public function index($groupId)
    {
        $members = GroupMember::with('client')->where('group_id', $groupId)->get();
        return response()->json($members);
    }

    public function store(Request $request, $groupId)
    {
        $data = $request->validate(['client_id' => 'required|exists:clients,client_id']);
        $data['group_id'] = $groupId;
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

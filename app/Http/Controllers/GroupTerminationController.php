<?php

namespace App\Http\Controllers;

use App\Models\Group;
use App\Models\GroupTermination;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class GroupTerminationController extends Controller
{
    public function index($groupId)
    {
        $logs = GroupTermination::where('group_id', $groupId)->get();
        return response()->json($logs);
    }

    public function store(Request $request, $groupId)
    {
        $data = $request->validate(['reason' => 'required|string']);
        $data['group_id'] = $groupId;
        $log = GroupTermination::create(array_merge($data, ['terminated_at' => now()]));
        // Also update group status
        Group::where('group_id', $groupId)
            ->where('status', 'active')
            ->update(['status' => 'terminated', 'status_changed_at' => now()]);
        return response()->json($log, Response::HTTP_CREATED);
    }
}

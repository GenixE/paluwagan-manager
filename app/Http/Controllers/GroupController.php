<?php

namespace App\Http\Controllers;

use App\Models\Group;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Symfony\Component\HttpFoundation\Response;
use Carbon\Carbon; // Import Carbon

class GroupController extends Controller
{
    public function index(Request $request): InertiaResponse
    {
        $query = Group::query()->withCount('members'); // Use withCount for member counting

        if ($request->has('status')) {
            $query->where('status', $request->query('status'));
        }

        return Inertia::render('group', [
            'groups' => $query->get()->map(fn ($group) => [
                'group_id' => $group->group_id,
                'name' => $group->name,
                'description' => $group->description,
                'current_cycle' => $group->current_cycle, // Included as it's in your TS type
                'status' => $group->status,
                'created_at' => $group->created_at ? Carbon::parse($group->created_at)->toDateString() : null,
                'status_changed_at' => $group->status_changed_at ? Carbon::parse($group->status_changed_at)->toDateString() : null,
                'members_count' => $group->members_count, // This is now available due to withCount
            ]),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'        => 'required|string|max:150',
            'description' => 'nullable|string',
        ]);

        $group = Group::create($data);
        return response()->json($group, Response::HTTP_CREATED);
    }

    public function show($id)
    {
        $group = Group::with(['members.client','cycles.contributions','cycles.payouts'])->findOrFail($id);
        return response()->json($group);
    }

    public function update(Request $request, $id)
    {
        $group = Group::findOrFail($id);
        $data = $request->validate([
            'name'        => 'sometimes|required|string|max:150',
            'description' => 'nullable|string',
        ]);
        $group->update($data);
        return response()->json($group);
    }

    public function terminate(Request $request, $id)
    {
        $request->validate(['reason' => 'nullable|string']);
        DB::statement('CALL TerminateGroup(?, ?)', [$id, $request->input('reason')]);
        $group = Group::findOrFail($id);
        return response()->json($group);
    }
}

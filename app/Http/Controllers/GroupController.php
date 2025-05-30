<?php

namespace App\Http\Controllers;

use App\Models\Group;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class GroupController extends Controller
{
    public function index(Request $request)
    {
        $query = Group::query();

        if ($request->has('status')) {
            $query->where('status', $request->query('status'));
        }

        $groups = $query->get();
        return response()->json($groups);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'        => 'required|string|max:150',
            'description' => 'nullable|string',
            'max_cycles'  => 'required|integer|min:1',
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
            'max_cycles'  => 'sometimes|required|integer|min:1',
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

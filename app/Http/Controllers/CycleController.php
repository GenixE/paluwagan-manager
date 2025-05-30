<?php

namespace App\Http\Controllers;

use App\Models\Cycle;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CycleController extends Controller
{
    public function index($groupId)
    {
        $cycles = Cycle::where('group_id', $groupId)->get();
        return response()->json($cycles);
    }

    public function store(Request $request, $groupId)
    {
        $data = $request->validate([
            'cycle_number' => "required|integer|min:1|unique:cycles,cycle_number,NULL,cycle_id,group_id,{$groupId}",
            'due_date'     => 'required|date',
            'payout_date'  => 'required|date|after_or_equal:due_date',
        ]);
        $data['group_id'] = $groupId;
        $cycle = Cycle::create($data);
        return response()->json($cycle, Response::HTTP_CREATED);
    }

    public function show($groupId, $id)
    {
        $cycle = Cycle::where('group_id', $groupId)->findOrFail($id);
        return response()->json($cycle);
    }

    public function update(Request $request, $groupId, $id)
    {
        $cycle = Cycle::where('group_id', $groupId)->findOrFail($id);
        $data = $request->validate([
            'due_date'    => 'sometimes|required|date',
            'payout_date' => 'sometimes|required|date|after_or_equal:due_date',
        ]);
        $cycle->update($data);
        return response()->json($cycle);
    }

    public function destroy($groupId, $id)
    {
        $cycle = Cycle::where('group_id', $groupId)->findOrFail($id);
        $cycle->delete();
        return response()->json(null, Response::HTTP_NO_CONTENT);
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\Cycle;
use App\Models\Group; // Import Group model
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Carbon\Carbon;

class CycleController extends Controller
{
    public function index($groupId)
    {
        $cycles = Cycle::where('group_id', $groupId)->orderBy('cycle_number', 'asc')->get();
        return response()->json($cycles);
    }

    public function store(Request $request, $groupId)
    {
        $data = $request->validate([
            'cycle_number' => "required|integer|min:1|unique:cycles,cycle_number,NULL,cycle_id,group_id,{$groupId}",
            'start_date'   => 'required|date|before_or_equal:end_date',
            'end_date'     => 'required|date|after_or_equal:start_date',
            'status'       => 'sometimes|required|in:pending,active,completed,cancelled',
        ]);
        $data['group_id'] = $groupId;

        if (!isset($data['status'])) {
            $data['status'] = 'pending'; // Default status if not provided
        }

        $cycle = Cycle::create($data);

        if ($cycle->status === 'active') {
            $group = Group::find($groupId);
            if ($group) {
                $group->current_cycle = $cycle->cycle_number;
                $group->save();
            }
        }

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
            'start_date'  => 'sometimes|required|date|before_or_equal:end_date',
            'end_date'    => 'sometimes|required|date|after_or_equal:start_date',
            'status'      => 'sometimes|required|in:pending,active,completed,cancelled',
        ]);

        // Date validation logic from previous step
        if (isset($data['start_date']) && !isset($data['end_date']) && $cycle->end_date) {
            if (Carbon::parse($data['start_date'])->gt(Carbon::parse($cycle->end_date))) {
                return response()->json(['errors' => ['start_date' => ['Start date must be before or equal to the current end date.']]], 422);
            }
        }
        if (isset($data['end_date']) && !isset($data['start_date']) && $cycle->start_date) {
            if (Carbon::parse($data['end_date'])->lt(Carbon::parse($cycle->start_date))) {
                return response()->json(['errors' => ['end_date' => ['End date must be after or equal to the current start date.']]], 422);
            }
        }

        $oldStatus = $cycle->status;
        $cycle->update($data);

        // Update group's current_cycle if this cycle becomes active
        if (isset($data['status']) && $data['status'] === 'active' && $oldStatus !== 'active') {
            $group = $cycle->group; // Assumes relation is loaded or use Group::find($groupId)
            if ($group) {
                $group->current_cycle = $cycle->cycle_number;
                $group->save();
            }
        }
        // Optional: Logic to clear group's current_cycle if this active cycle is completed/cancelled
        // else if (isset($data['status']) && ($data['status'] === 'completed' || $data['status'] === 'cancelled') && $oldStatus === 'active') {
        //     $group = $cycle->group;
        //     if ($group && $group->current_cycle === $cycle->cycle_number) {
        //         $group->current_cycle = null; // Or find next active/pending
        //         $group->save();
        //     }
        // }


        return response()->json($cycle);
    }

    public function destroy($groupId, $id)
    {
        $cycle = Cycle::where('group_id', $groupId)->findOrFail($id);
        $cycle->delete();
        return response()->json(null, Response::HTTP_NO_CONTENT);
    }
}

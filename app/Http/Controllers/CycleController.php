<?php

namespace App\Http\Controllers;

use App\Models\Cycle;
use App\Models\Group; // Import Group model
use Illuminate\Http\Request;
use Carbon\Carbon;
use Inertia\Inertia; // Import Inertia
use Illuminate\Http\RedirectResponse; // Import RedirectResponse
use Illuminate\Validation\ValidationException; // Import ValidationException
use Inertia\Response as InertiaResponse; // Import InertiaResponse for type hinting

class CycleController extends Controller
{
    public function index($groupId): InertiaResponse
    {
        $cycles = Cycle::where('group_id', $groupId)->orderBy('cycle_number', 'asc')->get();
        // You might want to transform the cycle data or eager-load relations if needed by the view
        return Inertia::render('Cycles/Index', [
            'cycles' => $cycles,
            'groupId' => $groupId,
        ]);
    }

    public function store(Request $request, $groupId): RedirectResponse
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

        return redirect()->back()->with('success', 'Cycle created successfully.');
    }

    public function show($groupId, $id): InertiaResponse
    {
        $cycle = Cycle::where('group_id', $groupId)->findOrFail($id);
        // You might want to load relations like $cycle->load('contributions', 'payouts');
        // depending on what 'Cycles/Show' component needs.
        return Inertia::render('Cycles/Show', [
            'cycle' => $cycle,
            'groupId' => $groupId,
        ]);
    }

    public function update(Request $request, $groupId, $id): RedirectResponse
    {
        $cycle = Cycle::where('group_id', $groupId)->findOrFail($id);
        $data = $request->validate([
            'start_date'  => 'sometimes|required|date|before_or_equal:end_date',
            'end_date'    => 'sometimes|required|date|after_or_equal:start_date',
            'status'      => 'sometimes|required|in:pending,active,completed,cancelled',
            // Note: cycle_number is not updatable here based on original validation.
            // If it should be, add 'cycle_number' => "sometimes|required|integer|min:1|unique:cycles,cycle_number,{$cycle->cycle_id},cycle_id,group_id,{$groupId}"
        ]);

        // Custom date validation logic
        if (isset($data['start_date']) && !isset($data['end_date']) && $cycle->end_date) {
            if (Carbon::parse($data['start_date'])->gt(Carbon::parse($cycle->end_date))) {
                throw ValidationException::withMessages([
                    'start_date' => ['Start date must be before or equal to the current end date.'],
                ]);
            }
        }
        if (isset($data['end_date']) && !isset($data['start_date']) && $cycle->start_date) {
            if (Carbon::parse($data['end_date'])->lt(Carbon::parse($cycle->start_date))) {
                throw ValidationException::withMessages([
                    'end_date' => ['End date must be after or equal to the current start date.'],
                ]);
            }
        }

        $oldStatus = $cycle->status;
        $cycle->update($data);

        // Update group's current_cycle if this cycle becomes active
        if (isset($data['status']) && $data['status'] === 'active' && $oldStatus !== 'active') {
            $group = $cycle->group;
            if ($group) {
                $group->current_cycle = $cycle->cycle_number;
                $group->save();
            }
        }
        // Logic to clear group's current_cycle if an active cycle is no longer active
        else if (isset($data['status']) && $data['status'] !== 'active' && $oldStatus === 'active') {
            $group = $cycle->group;
            if ($group && $group->current_cycle === $cycle->cycle_number) {
                $group->current_cycle = null; // Or find next active/pending
                $group->save();
            }
        }

        return redirect()->back()->with('success', 'Cycle updated successfully.');
    }

    public function destroy($groupId, $id): RedirectResponse
    {
        $cycle = Cycle::where('group_id', $groupId)->findOrFail($id);
        $group = $cycle->group;

        // If the cycle being deleted is the current cycle of the group, nullify it
        if ($group && $group->current_cycle === $cycle->cycle_number) {
            $group->current_cycle = null;
            $group->save();
        }

        $cycle->delete();
        return redirect()->back()->with('success', 'Cycle deleted successfully.');
    }
}

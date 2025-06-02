<?php

namespace Database\Factories;

use App\Models\Cycle;
use App\Models\Group;
use Illuminate\Database\Eloquent\Factories\Factory;
use Carbon\Carbon;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Cycle>
 */
class CycleFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */

    protected $model = Cycle::class;

    public function definition(): array
    {
        $startDate = $this->faker->dateTimeBetween('now', '+1 month');
        $endDate = Carbon::instance($startDate)->addWeeks(2);

        return [
            'group_id' => Group::factory(),
            'cycle_number' => 1,
            'start_date' => $startDate->format('Y-m-d'),
            'end_date' => $endDate->format('Y-m-d'),
            'status' => $this->faker->randomElement(['pending', 'active', 'completed', 'cancelled']), // Added status
        ];
    }
}

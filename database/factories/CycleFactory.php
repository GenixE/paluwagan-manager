<?php

namespace Database\Factories;

use App\Models\Cycle;
use App\Models\Group;
use Illuminate\Database\Eloquent\Factories\Factory;

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
        // Assume group exists, override cycle_number via states
        return [
            'group_id' => Group::factory(),
            'cycle_number' => 1,
            'due_date' => $this->faker->dateTimeBetween('now', '+1 month')->format('Y-m-d'),
            'payout_date' => $this->faker->dateTimeBetween('+1 month', '+2 months')->format('Y-m-d'),
        ];
    }
}

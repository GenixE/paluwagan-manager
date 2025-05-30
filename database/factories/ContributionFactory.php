<?php

namespace Database\Factories;

use App\Models\Contribution;
use App\Models\Cycle;
use App\Models\GroupMember;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Contribution>
 */
class ContributionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */

    protected $model = Contribution::class;

    public function definition(): array
    {
        $status = $this->faker->randomElement(['pending', 'paid', 'missed']);
        return [
            'cycle_id' => Cycle::factory(),
            'member_id' => GroupMember::factory(),
            'amount' => $this->faker->randomFloat(2, 50, 500),
            'status' => $status,
            'paid_at' => $status === 'paid' ? $this->faker->dateTimeBetween('-1 month', 'now') : null,
            'notes' => $this->faker->optional()->sentence,
        ];
    }
}

<?php

namespace Database\Factories;

use App\Models\Cycle;
use App\Models\GroupMember;
use App\Models\Payout;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Payout>
 */
class PayoutFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */

    protected $model = Payout::class;

    public function definition(): array
    {
        $status = $this->faker->randomElement(['scheduled','completed','failed']);
        return [
            'cycle_id' => Cycle::factory(),
            'member_id' => GroupMember::factory(),
            'amount' => $this->faker->randomFloat(2, 10, 1000),
            'status' => $status,
            'paid_at' => $status === 'completed' ? $this->faker->dateTimeThisYear() : null,
        ];
    }
}

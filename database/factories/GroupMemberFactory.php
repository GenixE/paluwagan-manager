<?php

namespace Database\Factories;

use App\Models\Client;
use App\Models\Group;
use App\Models\GroupMember;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\GroupMember>
 */
class GroupMemberFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */

    protected $model = GroupMember::class;

    public function definition(): array
    {
        return [
            'group_id' => Group::factory(),
            'client_id' => Client::factory(),
            'position' => $this->faker->numberBetween(1, 16), // Assuming max 16 positions
            'joined_at' => $this->faker->dateTimeBetween('-6 months', 'now'),
        ];
    }
}

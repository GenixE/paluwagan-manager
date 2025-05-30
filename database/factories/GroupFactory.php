<?php

namespace Database\Factories;

use App\Models\Group;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Group>
 */
class GroupFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */

    protected $model = Group::class;

    public function definition(): array
    {
        $max = $this->faker->numberBetween(3, 12);
        return [
            'name' => $this->faker->sentence(3),
            'description' => $this->faker->optional()->paragraph,
            'max_cycles' => $max,
            'status' => 'active',
            'status_changed_at' => null,
            'created_at' => $this->faker->dateTimeBetween('-6 months', 'now'),
        ];
    }
}

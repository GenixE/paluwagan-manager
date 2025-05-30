<?php

namespace Database\Factories;

use App\Models\Client;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Client>
 */
class ClientFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */

    protected $model = Client::class;
    public function definition(): array
    {
        return [
            'first_name' => $this->faker->firstName,
            'last_name' => $this->faker->lastName,
            'email' => $this->faker->unique()->safeEmail,
            'phone' => $this->faker->e164PhoneNumber,
            'address' => $this->faker->address,
            'updated_at' => $this->faker->dateTimeBetween('-6 months', 'now'),
            'created_at' => $this->faker->dateTimeBetween('-6 months', 'now'),
        ];
    }
}

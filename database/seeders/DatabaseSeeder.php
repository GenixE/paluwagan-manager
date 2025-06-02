<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Client;
use App\Models\Group;
use App\Models\Cycle;
use App\Models\GroupMember;
use App\Models\Contribution;
use App\Models\Payout;
use App\Models\GroupTermination;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        User::factory()->create([
            'name' => 'admin',
            'email' => 'admin@paluwagan.com',
            'password' => bcrypt('admin123'), // password
        ]);

        // Create some clients
        Client::factory()->count(30)->create();

        // Create several groups with related data
        Group::factory()
            ->count(5)
            ->create()
            ->each(function (Group $group) {
                // Add random members (between 4 and 8)
                $members = GroupMember::factory()
                    ->count(rand(4, 8))
                    ->for($group)
                    ->create();

                // Define cycles equal to max_cycles
                $cycles = [];
                for ($i = 1; $i <= $members->count(); $i++) {
                    $cycles[] = Cycle::factory()
                        ->for($group)
                        ->state(['cycle_number' => $i])
                        ->create();
                }
                // Seed contributions and payouts for each cycle
                foreach ($cycles as $cycle) {
                    // Create a contribution for every member in this cycle
                    foreach ($members as $member) {
                        Contribution::factory()
                            ->for($cycle)
                            ->for($member, 'member') // Specify the relationship name here
                            ->create();
                    }

                    // Randomly pick one member as payout recipient
                    $winner = $members->random();
                    Payout::factory()
                        ->for($cycle)
                        ->for($winner, 'member') // Assuming Payout model also has a 'member' relationship to GroupMember
                        ->create();
                }

                // Optionally terminate or finish some groups
                if (rand(1, 10) > 7) {
                    // Manually terminate a few groups
                    GroupTermination::factory()
                        ->for($group)
                        ->create();

                    $group->update([
                        'status' => 'terminated',
                        'status_changed_at' => now(),
                    ]);
                } else {
                    // Simulate finishing: mark as finished if all payouts completed
                    $group->update([
                        'status' => 'finished',
                        'status_changed_at' => now(),
                    ]);
                }
            });
    }
}

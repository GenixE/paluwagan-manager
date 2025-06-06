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
// Removed: use App\Models\GroupTermination;

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
        $clients = Client::factory()->count(30)->create();

        // Create several groups with related data
        Group::factory()
            ->count(5)
            ->create()
            ->each(function (Group $group) use ($clients) {
                $memberCount = rand(4, 8);
                $members = collect();

                // Create members with positions 1 through memberCount
                for ($position = 1; $position <= $memberCount; $position++) {
                    // For demonstration, allow some clients to have multiple positions
                    // 70% chance to use a new client, 30% chance to reuse an existing client
                    if ($position <= 3 || rand(1, 10) <= 7) {
                        $client = $clients->random();
                    } else {
                        // Reuse a client that's already in this group (different position)
                        $existingMember = $members->random();
                        $client = $existingMember->client;
                    }

                    $member = GroupMember::create([
                        'group_id' => $group->group_id,
                        'client_id' => $client->client_id,
                        'position' => $position,
                        'joined_at' => now(),
                    ]);

                    $members->push($member);
                }

                // Define cycles equal to member count (each position gets a cycle)
                $cycles = [];
                for ($i = 1; $i <= $memberCount; $i++) {
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

                    // The member with position matching the cycle number gets the payout
                    $winner = $members->where('position', $cycle->cycle_number)->first();
                    if ($winner) {
                        Payout::factory()
                            ->for($cycle)
                            ->for($winner, 'member') // Assuming Payout model also has a 'member' relationship to GroupMember
                            ->create();
                    }
                }

                // Optionally mark some groups as 'finished'.
                // Groups are 'active' by default (from the factory) or if not marked 'finished' here.
                if (rand(0, 1)) { // 50% chance to be marked as 'finished'
                    $group->update([
                        'status' => 'finished',
                        'status_changed_at' => now(),
                    ]);
                }
                // If not updated to 'finished', the group remains in its default 'active' state.
            });
    }
}

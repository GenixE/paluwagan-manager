<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('payouts', function (Blueprint $table) {
            $table->increments('payout_id');
            $table->unsignedInteger('cycle_id');
            $table->unsignedInteger('member_id');
            $table->decimal('amount', 12, 2);
            $table->enum('status', ['scheduled','completed','failed'])->default('scheduled');
            $table->dateTime('paid_at')->nullable();

            $table->unique(['cycle_id', 'member_id']);
            $table->foreign('cycle_id')->references('cycle_id')->on('cycles')->onDelete('cascade');
            $table->foreign('member_id')->references('member_id')->on('group_members')->onDelete('cascade');
        });

        // Trigger: update group status when final payout completes
//        DB::unprepared(<<<SQL
//CREATE TRIGGER `trg_after_payout_update`
//AFTER UPDATE ON `payouts`
//FOR EACH ROW
//BEGIN
//    DECLARE gid INT;
//    DECLARE completed_count INT;
//    DECLARE maxc INT;
//
//    IF NEW.status = 'completed' THEN
//        SELECT c.group_id INTO gid FROM cycles c WHERE c.cycle_id = NEW.cycle_id;
//
//        SELECT COUNT(*) INTO completed_count
//          FROM payouts p
//          JOIN cycles c2 ON p.cycle_id = c2.cycle_id
//         WHERE c2.group_id = gid
//           AND p.status = 'completed';
//
//        SELECT g.max_cycles INTO maxc FROM `groups` g WHERE g.group_id = gid;
//
//        IF completed_count >= maxc THEN
//            UPDATE `groups`
//               SET status = 'finished', status_changed_at = NOW()
//             WHERE group_id = gid AND status = 'active';
//        END IF;
//    END IF;
//END;
//SQL
//        );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::unprepared('DROP TRIGGER IF EXISTS `trg_after_payout_update`');
        Schema::dropIfExists('payouts');
    }
};

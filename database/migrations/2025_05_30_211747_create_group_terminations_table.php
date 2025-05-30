<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('group_terminations', function (Blueprint $table) {
            $table->increments('termination_id');
            $table->unsignedInteger('group_id');
            $table->text('reason')->nullable();
            $table->dateTime('terminated_at');

            $table->foreign('group_id')->references('group_id')->on('groups')->onDelete('cascade');
        });

        // Stored procedure for manual termination
        DB::unprepared('DROP PROCEDURE IF EXISTS `TerminateGroup`');
        DB::unprepared(<<<SQL
CREATE PROCEDURE `TerminateGroup`(IN p_group_id INT, IN p_reason TEXT)
BEGIN
    UPDATE `groups` SET status = 'terminated', status_changed_at = NOW()
     WHERE group_id = p_group_id AND status = 'active';
    INSERT INTO group_terminations (group_id, reason, terminated_at)
    VALUES (p_group_id, p_reason, NOW());
END;
SQL
        );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::unprepared('DROP PROCEDURE IF EXISTS `TerminateGroup`');
        Schema::dropIfExists('group_terminations');
    }
};

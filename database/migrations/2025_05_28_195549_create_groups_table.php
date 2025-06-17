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
        Schema::create('groups', function (Blueprint $table) {
            $table->increments('group_id');
            $table->string('name', 150);
            $table->text('description')->nullable();
            $table->integer('current_cycle')->nullable(); // Added this line
            $table->dateTime('created_at')->useCurrent();
            $table->enum('status', ['active','finished'])->default('active');
            $table->dateTime('status_changed_at')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('groups', function (Blueprint $table) {
            if (Schema::hasColumn('groups', 'current_cycle')) { // Check if column exists before dropping
                $table->dropColumn('current_cycle');
            }
        });
        Schema::dropIfExists('groups'); // This line should remain to drop the table itself
    }
};

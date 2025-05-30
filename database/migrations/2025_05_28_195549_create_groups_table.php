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
            $table->dateTime('created_at')->useCurrent();
            $table->unsignedInteger('max_cycles');
            $table->enum('status', ['active','finished','terminated'])->default('active');
            $table->dateTime('status_changed_at')->nullable();
        });

        // enforce max_cycles > 0
        DB::statement('ALTER TABLE `groups` ADD CONSTRAINT chk_max_cycles CHECK (max_cycles > 0)');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('groups');
    }
};

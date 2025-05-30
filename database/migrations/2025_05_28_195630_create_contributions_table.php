<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('contributions', function (Blueprint $table) {
            $table->increments('contribution_id');
            $table->unsignedInteger('cycle_id');
            $table->unsignedInteger('member_id');
            $table->decimal('amount', 12, 2);
            $table->enum('status', ['pending','paid','missed'])->default('pending');
            $table->dateTime('paid_at')->nullable();
            $table->text('notes')->nullable();

            $table->unique(['cycle_id', 'member_id']);
            $table->foreign('cycle_id')->references('cycle_id')->on('cycles')->onDelete('cascade');
            $table->foreign('member_id')->references('member_id')->on('group_members')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('contributions');
    }
};

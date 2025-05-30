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
        Schema::create('cycles', function (Blueprint $table) {
            $table->increments('cycle_id');
            $table->unsignedInteger('group_id');
            $table->integer('cycle_number');
            $table->date('due_date');
            $table->date('payout_date');

            $table->unique(['group_id', 'cycle_number']);
            $table->foreign('group_id')->references('group_id')->on('groups')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cycles');
    }
};

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
        Schema::create('group_members', function (Blueprint $table) {
            $table->increments('member_id');
            $table->unsignedInteger('group_id');
            $table->unsignedInteger('client_id');
            $table->dateTime('joined_at')->useCurrent();

            $table->unique(['group_id', 'client_id']);
            $table->foreign('group_id')->references('group_id')->on('groups')->onDelete('cascade');
            $table->foreign('client_id')->references('client_id')->on('clients')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('group_members');
    }
};

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Group extends Model
{
    protected $table = 'groups';
    protected $primaryKey = 'group_id';
    public $timestamps = false;
    protected $fillable = ['name', 'description', 'max_cycles', 'status'];
    protected $dates = ['created_at', 'status_changed_at'];

    use HasFactory;

    public function members(): HasMany
    {
        return $this->hasMany(GroupMember::class, 'group_id', 'group_id');
    }

    public function cycles(): HasMany
    {
        return $this->hasMany(Cycle::class, 'group_id', 'group_id');
    }

    public function terminations(): HasMany
    {
        return $this->hasMany(GroupTermination::class, 'group_id', 'group_id');
    }
}


<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Client extends Model
{
    protected $table = 'clients';
    protected $primaryKey = 'client_id';
    public $timestamps = false;
    protected $fillable = ['first_name', 'last_name', 'email', 'phone', 'address'];
    protected $dates = ['created_at', 'updated_at'];

    use HasFactory;

    public function memberships(): HasMany
    {
        return $this->hasMany(GroupMember::class, 'client_id', 'client_id');
    }

    public function groups(): BelongsToMany
    {
        return $this->belongsToMany(Group::class, 'group_members', 'client_id', 'group_id');
    }
}

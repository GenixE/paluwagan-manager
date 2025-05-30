<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GroupMember extends Model
{
    protected $table = 'group_members';
    protected $primaryKey = 'member_id';
    public $timestamps = false;
    protected $fillable = ['group_id', 'client_id'];
    protected $dates = ['joined_at'];

    use HasFactory;

    public function group(): BelongsTo
    {
        return $this->belongsTo(Group::class, 'group_id', 'group_id');
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class, 'client_id', 'client_id');
    }

    public function contributions(): HasMany
    {
        return $this->hasMany(Contribution::class, 'member_id', 'member_id');
    }

    public function payouts(): HasMany
    {
        return $this->hasMany(Payout::class, 'member_id', 'member_id');
    }
}

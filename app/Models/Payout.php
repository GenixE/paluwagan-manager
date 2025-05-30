<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payout extends Model
{
    protected $table = 'payouts';
    protected $primaryKey = 'payout_id';
    public $timestamps = false;
    protected $fillable = ['cycle_id', 'member_id', 'amount', 'status', 'paid_at'];
    protected $dates = ['paid_at'];

    use HasFactory;

    public function cycle(): BelongsTo
    {
        return $this->belongsTo(Cycle::class, 'cycle_id', 'cycle_id');
    }

    public function member(): BelongsTo
    {
        return $this->belongsTo(GroupMember::class, 'member_id', 'member_id');
    }
}

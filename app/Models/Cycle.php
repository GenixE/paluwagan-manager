<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Cycle extends Model
{
    protected $table = 'cycles';
    protected $primaryKey = 'cycle_id';
    public $timestamps = false;
    protected $fillable = ['group_id', 'cycle_number', 'due_date', 'payout_date'];
    protected $dates = ['due_date', 'payout_date'];

    use HasFactory;

    public function group(): BelongsTo
    {
        return $this->belongsTo(Group::class, 'group_id', 'group_id');
    }

    public function contributions(): HasMany
    {
        return $this->hasMany(Contribution::class, 'cycle_id', 'cycle_id');
    }

    public function payouts(): HasMany
    {
        return $this->hasMany(Payout::class, 'cycle_id', 'cycle_id');
    }
}

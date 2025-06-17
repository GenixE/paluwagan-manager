<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Contribution extends Model
{
    protected $table = 'contributions';
    protected $primaryKey = 'contribution_id';
    public $timestamps = false;
    protected $fillable = ['cycle_id', 'member_id', 'amount', 'status', 'paid_at', 'notes'];
    protected $dates = ['paid_at'];

    protected $casts = [
        'paid_at' => 'datetime',
        'amount' => 'decimal:2', // Example cast, adjust if needed
    ];

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

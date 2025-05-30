<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GroupTermination extends Model
{
    protected $table = 'group_terminations';
    protected $primaryKey = 'termination_id';
    public $timestamps = false;
    protected $fillable = ['group_id', 'reason', 'terminated_at'];
    protected $dates = ['terminated_at'];

    use HasFactory;

    public function group(): BelongsTo
    {
        return $this->belongsTo(Group::class, 'group_id', 'group_id');
    }
}

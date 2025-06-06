<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Carbon\Carbon;

class Group extends Model
{
    use HasFactory;

    protected $primaryKey = 'group_id';
    public $timestamps = false; // Assuming you have created_at/updated_at

    protected $fillable = [
        'name',
        'description',
        'current_cycle', // Added
        'status',          // Added (for group status)
        'status_changed_at',
        // Add other fillable fields as necessary
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'status_changed_at' => 'datetime',
        'current_cycle' => 'integer',
    ];

    public function members(): HasMany
    {
        return $this->hasMany(GroupMember::class, 'group_id', 'group_id');
    }

    public function cycles(): HasMany
    {
        return $this->hasMany(Cycle::class, 'group_id', 'group_id');
    }

    // Accessor to automatically update status_changed_at when status is changed
    public function setStatusAttribute($value)
    {
        if (array_key_exists('status', $this->attributes) && $this->attributes['status'] !== $value) {
            $this->attributes['status_changed_at'] = Carbon::now();
        } else if (!array_key_exists('status', $this->attributes) && $this->exists) { // For initial set on existing model
            $this->attributes['status_changed_at'] = Carbon::now();
        }
        $this->attributes['status'] = $value;
    }
}

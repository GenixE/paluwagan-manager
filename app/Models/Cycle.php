<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Cycle extends Model
{
    use HasFactory;

    protected $table = 'cycles';
    protected $primaryKey = 'cycle_id';
    public $timestamps = false; // Assuming no created_at/updated_at for cycles themselves

    protected $fillable = [
        'group_id',
        'cycle_number',
        'start_date',
        'end_date', // Corrected from due_date
        'status'    // Added
    ];

    // The $dates property is deprecated in newer Laravel versions in favor of $casts.
    // If you are on Laravel 9+ $casts is preferred.
    // For older versions, $dates would be: protected $dates = ['start_date', 'end_date'];

    protected $casts = [
        'start_date' => 'date:Y-m-d',
        'end_date' => 'date:Y-m-d',
        // 'status' can be left as string or cast to a custom Enum if you create one.
    ];

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

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GroupInviteLink extends Model
{
    protected $guarded = [];

    protected $casts = [
        'expires_at' => 'datetime',
        'active' => 'boolean',
    ];

    public function groupe()
    {
        return $this->belongsTo(Groupe::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function isValid(): bool
    {
        if (!$this->active) return false;
        if ($this->expires_at && $this->expires_at->isPast()) return false;
        if ($this->max_uses && $this->uses_count >= $this->max_uses) return false;

        return true;
    }
}

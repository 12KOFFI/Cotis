<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GroupInviteLink extends Model
{
    protected $fillable = [
        'groupe_id', 'token', 'active', 'expires_at', 'max_uses', 'uses_count',
        'created_by', 'target_name', 'target_prenom', 'montant_perso',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'active' => 'boolean',
        'montant_perso' => 'integer',
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

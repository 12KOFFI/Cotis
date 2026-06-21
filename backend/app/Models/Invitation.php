<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Invitation extends Model
{
    protected $fillable = [
        'groupe_id', 'membre_id', 'email', 'telephone', 'token',
        'canal', 'statut', 'expire_at', 'acceptee_at',
    ];
    protected $casts = ['expire_at' => 'datetime', 'acceptee_at' => 'datetime'];
    public function groupe() { return $this->belongsTo(Groupe::class); }
    public function membre() { return $this->belongsTo(Membre::class); }
}

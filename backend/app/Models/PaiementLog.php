<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaiementLog extends Model
{
    protected $guarded = [];
    protected $casts = ['avant' => 'array', 'apres' => 'array'];
    public function paiement() { return $this->belongsTo(Paiement::class); }
    public function auteur() { return $this->belongsTo(User::class, 'auteur_id'); }
}

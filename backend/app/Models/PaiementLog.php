<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaiementLog extends Model
{
    protected $fillable = [
        'paiement_id', 'auteur_id', 'avant', 'apres', 'action',
    ];
    protected $casts = ['avant' => 'array', 'apres' => 'array'];
    public function paiement() { return $this->belongsTo(Paiement::class); }
    public function auteur() { return $this->belongsTo(User::class, 'auteur_id'); }
}

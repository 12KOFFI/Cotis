<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Paiement extends Model
{
    protected $guarded = [];
    protected $casts = ['date_paiement' => 'date', 'modifie' => 'boolean', 'historique' => 'array', 'valide_at' => 'datetime'];
    public function groupe() { return $this->belongsTo(Groupe::class); }
    public function membre() { return $this->belongsTo(Membre::class); }
    public function periode() { return $this->belongsTo(Periode::class); }
    public function logs() { return $this->hasMany(PaiementLog::class); }
    public function auteur() { return $this->belongsTo(User::class, 'enregistre_par'); }
    public function validePar() { return $this->belongsTo(User::class, 'valide_par'); }
}

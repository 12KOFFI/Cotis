<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Membre extends Model
{
    protected $guarded = [];

    public function groupe() { return $this->belongsTo(Groupe::class); }
    public function user() { return $this->belongsTo(User::class); }
    public function paiements() { return $this->hasMany(Paiement::class); }
    public function adhesion() { return $this->hasOne(AdhesionFrais::class); }
    public function credits() { return $this->hasMany(CreditMembre::class); }

    public function getFullNameAttribute() {
        return trim(($this->prenom ?? '') . ' ' . $this->nom);
    }
}

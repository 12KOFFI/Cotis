<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Groupe extends Model
{
    protected $guarded = [];
    protected $casts = [
        'adhesion_active' => 'boolean',
        'montant_personnalisable' => 'boolean',
        'dates_autres' => 'array',
        'date_debut' => 'date',
    ];

    public function gestionnaire() { return $this->belongsTo(User::class, 'gestionnaire_id'); }
    public function membres() { return $this->hasMany(Membre::class); }
    public function invitations() { return $this->hasMany(Invitation::class); }
    public function periodes() { return $this->hasMany(Periode::class); }
    public function paiements() { return $this->hasMany(Paiement::class); }
    public function caisse() { return $this->hasOne(Caisse::class); }
    public function adhesions() { return $this->hasMany(AdhesionFrais::class); }
}

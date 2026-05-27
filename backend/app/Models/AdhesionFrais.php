<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AdhesionFrais extends Model
{
    protected $table = 'adhesion_frais';
    protected $fillable = [
        'groupe_id', 'membre_id', 'montant_du', 'montant_paye', 'statut', 'paye_at',
    ];
    protected $casts = ['paye_at' => 'datetime'];
    public function groupe() { return $this->belongsTo(Groupe::class); }
    public function membre() { return $this->belongsTo(Membre::class); }
}

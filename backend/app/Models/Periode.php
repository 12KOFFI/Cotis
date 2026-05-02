<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Periode extends Model
{
    protected $guarded = [];
    protected $casts = ['date_debut' => 'date', 'date_fin' => 'date', 'echeance' => 'date'];
    public function groupe() { return $this->belongsTo(Groupe::class); }
    public function paiements() { return $this->hasMany(Paiement::class); }
}

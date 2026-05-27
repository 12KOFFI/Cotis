<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CreditMembre extends Model
{
    protected $fillable = [
        'groupe_id', 'membre_id', 'montant', 'periode_source_id',
    ];
    public function groupe() { return $this->belongsTo(Groupe::class); }
    public function membre() { return $this->belongsTo(Membre::class); }
}

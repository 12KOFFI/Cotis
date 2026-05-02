<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CaisseLedger extends Model
{
    protected $guarded = [];
    protected $casts = ['date' => 'date'];
    public function caisse() { return $this->belongsTo(Caisse::class); }
    public function groupe() { return $this->belongsTo(Groupe::class); }
    public function paiement() { return $this->belongsTo(Paiement::class); }
    public function auteur() { return $this->belongsTo(User::class, 'auteur_id'); }
}

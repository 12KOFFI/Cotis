<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CaisseLedger extends Model
{
    protected $fillable = [
        'caisse_id', 'groupe_id', 'type', 'montant',
        'motif', 'date', 'paiement_id', 'auteur_id',
    ];
    protected $casts = ['date' => 'date'];
    public function caisse() { return $this->belongsTo(Caisse::class); }
    public function groupe() { return $this->belongsTo(Groupe::class); }
    public function paiement() { return $this->belongsTo(Paiement::class); }
    public function auteur() { return $this->belongsTo(User::class, 'auteur_id'); }
}

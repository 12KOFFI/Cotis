<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Paiement extends Model
{
    protected $fillable = [
        'groupe_id', 'membre_id', 'periode_id', 'type',
        'montant', 'mode', 'statut', 'date_paiement',
        'transaction_id', 'note', 'preuve_path', 'modifie',
        'historique', 'enregistre_par',
        // Champs financiers : séparation stricte net / frais
        'montant_membre',        // Montant total réellement débité au membre (net + frais)
        'frais_gateway',         // Frais prélevés par GeniusPay/Wave (2.5% + 100F)
        'commission_plateforme', // Commission CotisPro (1%)
    ];

    protected $casts = [
        'date_paiement' => 'date',
        'modifie'       => 'boolean',
        'historique'    => 'array',
        'valide_at'     => 'datetime',
    ];

    /* ---------- Relations ---------- */
    public function groupe()   { return $this->belongsTo(Groupe::class); }
    public function membre()   { return $this->belongsTo(Membre::class); }
    public function periode()  { return $this->belongsTo(Periode::class); }
    public function logs()     { return $this->hasMany(PaiementLog::class); }
    public function auteur()   { return $this->belongsTo(User::class, 'enregistre_par'); }
    public function validePar(){ return $this->belongsTo(User::class, 'valide_par'); }

    /* ---------- Scopes ---------- */

    /**
     * Scope réutilisable : cotisations réussies pour un membre et une période.
     * Usage : Paiement::cotisationReussie($membreId, $periodeId)->sum('montant')
     */
    public function scopeCotisationReussie($query, int $membreId, int $periodeId)
    {
        return $query->where('membre_id', $membreId)
                     ->where('periode_id', $periodeId)
                     ->where('type', 'cotisation')
                     ->where('statut', 'reussi');
    }
}

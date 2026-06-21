<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class Caisse extends Model
{
    protected $fillable = ['groupe_id', 'solde'];

    protected $appends = ['solde_total', 'solde_disponible'];

    public function groupe() { return $this->belongsTo(Groupe::class); }
    public function ledger() { return $this->hasMany(CaisseLedger::class); }

    /**
     * Solde total = SUM(entrées) - SUM(sorties)
     * Calculé dynamiquement depuis le ledger — jamais stocké.
     */
    public function getSoldeTotalAttribute(): int
    {
        $row = CaisseLedger::where('caisse_id', $this->id)
            ->selectRaw("
                COALESCE(SUM(CASE WHEN type = 'entree' THEN montant ELSE 0 END), 0) as total_entrees,
                COALESCE(SUM(CASE WHEN type = 'sortie'  THEN montant ELSE 0 END), 0) as total_sorties
            ")
            ->first();

        return (int) ($row->total_entrees - $row->total_sorties);
    }

    /**
     * Solde disponible (retirable) = uniquement les montants reçus via Wave (mobile money).
     * C'est l'argent qui se trouve dans le compte Wave du groupe.
     */
    public function getSoldeDisponibleAttribute(): int
    {
        $waveEntrees = (int) CaisseLedger::where('caisse_id', $this->id)
            ->where('type', 'entree')
            ->whereHas('paiement', function ($q) {
                $q->where('mode', 'wave');
            })
            ->sum('montant');

        $sorties = (int) CaisseLedger::where('caisse_id', $this->id)
            ->where('type', 'sortie')
            ->sum('montant');

        return max(0, $waveEntrees - $sorties);
    }

    /**
     * Raccourcis pour les agrégats (évite N+1 dans les controllers)
     * Une seule passe SQL pour tout calculer.
     */
    public function aggregats(): array
    {
        $row = CaisseLedger::where('caisse_id', $this->id)
            ->selectRaw("
                COALESCE(SUM(CASE WHEN type = 'entree' THEN montant ELSE 0 END), 0) as total_entrees,
                COALESCE(SUM(CASE WHEN type = 'sortie'  THEN montant ELSE 0 END), 0) as total_sorties
            ")
            ->first();

        $entrees = (int) $row->total_entrees;
        $sorties = (int) $row->total_sorties;

        // Solde retirable = entrées Wave - TOUTES les sorties
        $waveEntrees = (int) CaisseLedger::where('caisse_id', $this->id)
            ->where('type', 'entree')
            ->whereHas('paiement', function ($q) {
                $q->where('mode', 'wave');
            })
            ->sum('montant');

        return [
            'total_entrees'    => $entrees,
            'total_sorties'    => $sorties,
            'solde_total'      => $entrees - $sorties,
            'solde_disponible' => max(0, $waveEntrees - $sorties),
        ];
    }
}

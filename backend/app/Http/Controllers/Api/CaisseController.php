<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Groupe;
use App\Models\CaisseLedger;
use Illuminate\Http\Request;

class CaisseController extends Controller
{
    public function show(Request $request, Groupe $groupe)
    {
        $this->authorizeGroupe($request, $groupe, true);
        $caisse = $groupe->caisse;
        $ledger = CaisseLedger::where('groupe_id', $groupe->id)->with('paiement.membre')->latest('date')->limit(100)->get();

        // Soldes calculés dynamiquement depuis le ledger
        $agg = $caisse ? $caisse->aggregats() : [
            'total_entrees' => 0, 'total_sorties' => 0,
            'solde_total' => 0, 'solde_disponible' => 0,
        ];

        return response()->json([
            'caisse' => $caisse,
            'ledger' => $ledger,
            'total_entrees'    => $agg['total_entrees'],
            'total_sorties'    => $agg['total_sorties'],
            'solde_total'      => $agg['solde_total'],
            'solde_disponible' => $agg['solde_disponible'],
        ]);
    }

    public function decaisser(Request $request, Groupe $groupe)
    {
        $this->authorizeGroupe($request, $groupe);
        $data = $request->validate([
            'montant' => 'required|integer|min:1',
            'motif' => 'required|string|max:200',
            'beneficiaire' => 'nullable|string|max:200',
            'date' => 'required|date',
        ]);
        $caisse = $groupe->caisse;
        abort_unless($caisse, 422, 'Caisse introuvable');

        // Vérification sur le solde disponible calculé (jamais sur un champ stocké)
        $soldeDisponible = $caisse->solde_disponible;
        abort_if($soldeDisponible < $data['montant'], 422, 'Solde insuffisant (disponible : ' . $soldeDisponible . ' FCFA)');

        CaisseLedger::create([
            'caisse_id' => $caisse->id,
            'groupe_id' => $groupe->id,
            'type' => 'sortie',
            'montant' => $data['montant'],
            'motif' => $data['motif'],
            'beneficiaire' => $data['beneficiaire'] ?? null,
            'date' => $data['date'],
            'auteur_id' => $request->user()->id,
        ]);

        // Retourner les soldes recalculés
        $agg = $caisse->aggregats();
        return response()->json([
            'solde_total'      => $agg['solde_total'],
            'solde_disponible' => $agg['solde_disponible'],
        ]);
    }

    protected function authorizeGroupe(Request $request, Groupe $groupe, bool $allowMember = false): void
    {
        $u = $request->user();
        if ($u->role === 'super_admin') return;
        if ($groupe->gestionnaire_id === $u->id) return;
        // Trésorier a les mêmes droits que le gestionnaire sur la caisse
        $membreRecord = $groupe->membres()->where('user_id', $u->id)->first();
        if ($membreRecord && $membreRecord->role === 'tresorier') return;
        if ($allowMember && $membreRecord) return;
        abort(403);
    }
}

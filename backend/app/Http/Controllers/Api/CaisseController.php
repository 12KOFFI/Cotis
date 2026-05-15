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
        $entrees = (int) CaisseLedger::where('groupe_id', $groupe->id)->where('type', 'entree')->sum('montant');
        $sorties = (int) CaisseLedger::where('groupe_id', $groupe->id)->where('type', 'sortie')->sum('montant');
        return response()->json([
            'caisse' => $caisse,
            'ledger' => $ledger,
            'total_entrees' => $entrees,
            'total_sorties' => $sorties,
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
        abort_if($caisse->solde < $data['montant'], 422, 'Solde insuffisant');
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
        $caisse->solde -= $data['montant'];
        $caisse->save();
        return response()->json(['caisse' => $caisse]);
    }

    protected function authorizeGroupe(Request $request, Groupe $groupe, bool $allowMember = false): void
    {
        $u = $request->user();
        if ($u->role === 'super_admin') return;
        if ($groupe->gestionnaire_id === $u->id) return;
        if ($allowMember && $groupe->membres()->where('user_id', $u->id)->exists()) return;
        abort(403);
    }
}

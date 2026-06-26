<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Groupe;
use App\Models\Membre;
use App\Models\AdhesionFrais;
use App\Traits\AuthorizesGroupe;
use Illuminate\Http\Request;

class MembreController extends Controller
{
    use AuthorizesGroupe;

    public function index(Request $request, Groupe $groupe)
    {
        $this->authorizeGroupe($request, $groupe);

        $paiementsGroupes = \App\Models\Paiement::where('groupe_id', $groupe->id)
            ->where('type', 'cotisation')
            ->where('statut', 'reussi')
            ->get()
            ->groupBy('membre_id');

        $membres = $groupe->membres()->with('adhesion')->get()->map(function ($membre) use ($groupe, $paiementsGroupes) {
            $preloadedPaiements = $paiementsGroupes->get($membre->id, collect());
            $membre->statut_cotisation = $membre->computeStatutCotisation($groupe, null, $preloadedPaiements);
            return $membre;
        });
        return response()->json(['membres' => $membres]);
    }

    public function store(Request $request, Groupe $groupe)
    {
        $this->authorizeGroupe($request, $groupe);
        $data = $request->validate([
            'nom'           => 'required|string|max:120',
            'prenom'        => 'nullable|string|max:120',
            'telephone'     => 'nullable|string|max:30',
            'email'         => 'nullable|email',
            'note'          => 'nullable|string',
            'montant_perso' => 'nullable|integer|min:0',
        ]);
        $data['groupe_id'] = $groupe->id;
        $data['statut'] = 'actif_non_verifie';
        $data['role'] = 'membre';
        $membre = Membre::create($data);

        // Create adhesion frais record if group has adhesion
        if ($groupe->adhesion_active && $groupe->adhesion_montant > 0) {
            AdhesionFrais::create([
                'groupe_id'  => $groupe->id,
                'membre_id'  => $membre->id,
                'montant_du' => $groupe->adhesion_montant,
            ]);
        }
        return response()->json(['membre' => $membre], 201);
    }

    public function update(Request $request, Groupe $groupe, Membre $membre)
    {
        $this->authorizeGroupe($request, $groupe);
        abort_unless($membre->groupe_id === $groupe->id, 404);
        $data = $request->validate([
            'nom'           => 'sometimes|string',
            'prenom'        => 'nullable|string',
            'telephone'     => 'nullable|string',
            'email'         => 'nullable|email',
            'role'          => 'sometimes|in:gestionnaire,tresorier,membre',
            'statut'        => 'sometimes|in:actif_non_verifie,actif,suspendu',
            'montant_perso' => 'nullable|integer|min:0',
            'note'          => 'nullable|string',
        ]);
        $membre->update($data);
        return response()->json(['membre' => $membre]);
    }

    public function assignTresorier(Request $request, Groupe $groupe, Membre $membre)
    {
        $this->authorizeGroupe($request, $groupe);
        abort_unless($membre->groupe_id === $groupe->id, 404);
        $membre->role = $membre->role === 'tresorier' ? 'membre' : 'tresorier';
        $membre->save();
        return response()->json(['membre' => $membre]);
    }

    public function destroy(Request $request, Groupe $groupe, Membre $membre)
    {
        $this->authorizeGroupe($request, $groupe);
        abort_unless($membre->groupe_id === $groupe->id, 404);
        abort_if($membre->role === 'gestionnaire', 422, "Impossible de supprimer le gestionnaire");
        $membre->delete();
        return response()->json(['ok' => true]);
    }

    public function show(Request $request, Groupe $groupe, Membre $membre)
    {
        $this->authorizeGroupe($request, $groupe, true);
        abort_unless($membre->groupe_id === $groupe->id, 404);
        $membre->load('paiements', 'adhesion', 'credits');
        $membre->statut_cotisation = $membre->computeStatutCotisation($groupe);
        return response()->json(['membre' => $membre]);
    }
}

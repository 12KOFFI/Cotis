<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Groupe;
use App\Models\Caisse;
use App\Models\Membre;
use App\Models\Periode;
use App\Models\AdhesionFrais;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class GroupeController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $membreGroupeIds = Membre::where('user_id', $user->id)->pluck('groupe_id');
        $groupes = Groupe::where('gestionnaire_id', $user->id)
            ->orWhereIn('id', $membreGroupeIds)
            ->withCount('membres')
            ->with('caisse')
            ->get();
        return response()->json(['groupes' => $groupes]);
    }

    public function show(Request $request, Groupe $groupe)
    {
        $this->authorizeGroupe($request, $groupe);
        $groupe->load('caisse', 'membres', 'periodes');
        return response()->json(['groupe' => $groupe]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'nom' => 'required|string|max:150',
            'type' => 'required|in:tontine,cooperative,association,autre',
            'description' => 'nullable|string',
            'logo' => 'nullable|string',
            'devise' => 'nullable|string|max:10',
            'adhesion_active' => 'boolean',
            'adhesion_montant' => 'nullable|integer|min:0',
            'frequence' => 'required|in:hebdomadaire,mensuelle,trimestrielle,annuelle,autre',
            'dates_autres' => 'nullable|array',
            'montant_standard' => 'required|integer|min:0',
            'montant_personnalisable' => 'boolean',
            'date_debut' => 'required|date',
            'wave_numero' => 'nullable|string|max:30',
            'wave_pays' => 'nullable|string|in:CI,SN',
        ]);
        $data['gestionnaire_id'] = $request->user()->id;
        $groupe = Groupe::create($data);
        // Create unique caisse
        Caisse::create(['groupe_id' => $groupe->id, 'solde' => 0]);
        // Create gestionnaire as a member too
        Membre::create([
            'groupe_id' => $groupe->id,
            'user_id' => $request->user()->id,
            'nom' => $request->user()->name,
            'email' => $request->user()->email,
            'telephone' => $request->user()->telephone,
            'role' => 'gestionnaire',
            'statut' => 'actif',
        ]);
        // Create first period
        $this->generatePeriod($groupe);
        return response()->json(['groupe' => $groupe->load('caisse')], 201);
    }

    public function update(Request $request, Groupe $groupe)
    {
        $this->authorizeGroupe($request, $groupe);
        $data = $request->validate([
            'nom' => 'sometimes|string|max:150',
            'description' => 'nullable|string',
            'logo' => 'nullable|string',
            'wave_numero' => 'nullable|string|max:30',
            'devise' => 'sometimes|string|max:10',
            'montant_standard' => 'sometimes|integer|min:0',
            'adhesion_active' => 'boolean',
            'adhesion_montant' => 'nullable|integer|min:0',
            'montant_personnalisable' => 'boolean',
        ]);
        $groupe->update($data);
        return response()->json(['groupe' => $groupe]);
    }

    protected function generatePeriod(Groupe $groupe): Periode
    {
        $start = Carbon::parse($groupe->date_debut);
        $end = match ($groupe->frequence) {
            'hebdomadaire' => $start->copy()->addWeek()->subDay(),
            'mensuelle' => $start->copy()->addMonth()->subDay(),
            'trimestrielle' => $start->copy()->addMonths(3)->subDay(),
            'annuelle' => $start->copy()->addYear()->subDay(),
            default => $start->copy()->addMonth()->subDay(),
        };
        $nbMembres = max(1, $groupe->membres()->where('statut', 'actif')->count());
        return Periode::create([
            'groupe_id' => $groupe->id,
            'date_debut' => $start,
            'date_fin' => $end,
            'echeance' => $end,
            'montant_attendu' => $groupe->montant_standard * $nbMembres,
        ]);
    }

    public function destroy(Request $request, Groupe $groupe)
    {
        $this->authorizeGroupe($request, $groupe);

        $hasPaiements = $groupe->paiements()->exists();
        if ($hasPaiements) {
            return response()->json([
                'message' => 'Impossible de supprimer ce groupe car des paiements ont déjà été effectués.'
            ], 400);
        }

        $groupe->delete();
        return response()->json(['message' => 'Groupe supprimé avec succès.']);
    }

    protected function authorizeGroupe(Request $request, Groupe $groupe): void
    {
        abort_unless($groupe->gestionnaire_id === $request->user()->id || $request->user()->role === 'super_admin', 403, 'Accès refusé');
    }
}

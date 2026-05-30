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
            'type_autre' => 'required_if:type,autre|nullable|string|max:150',
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
        // Ensure adhesion_montant is never null — default to 0 when adhesion is inactive
        if (empty($data['adhesion_active']) || !isset($data['adhesion_montant'])) {
            $data['adhesion_montant'] = 0;
        }
        $groupe = Groupe::create($data);
        // Create unique caisse
        Caisse::create(['groupe_id' => $groupe->id, 'solde' => 0]);
        // Check if gestionnaire already has a member card
        $hasCard = Membre::where('user_id', $request->user()->id)
            ->where('role', 'gestionnaire')
            ->exists();

        if (!$hasCard) {
            // Create gestionnaire as a member too (this is their unique card)
            Membre::create([
                'groupe_id' => $groupe->id,
                'user_id' => $request->user()->id,
                'nom' => $request->user()->name,
                'email' => $request->user()->email,
                'telephone' => $request->user()->telephone,
                'role' => 'gestionnaire',
                'statut' => 'actif',
            ]);
        }
        // Create first period
        $this->generatePeriod($groupe);
        return response()->json(['groupe' => $groupe->load('caisse')], 201);
    }

    public function update(Request $request, Groupe $groupe)
    {
        $this->authorizeGroupe($request, $groupe);
        $data = $request->validate([
            'nom' => 'sometimes|string|max:150',
            'type' => 'sometimes|in:tontine,cooperative,association,autre',
            'type_autre' => 'required_if:type,autre|nullable|string|max:150',
            'description' => 'nullable|string',
            'logo' => 'nullable|string',
            'wave_numero' => 'nullable|string|max:30',
            'devise' => 'sometimes|string|max:10',
            'montant_standard' => 'sometimes|integer|min:0',
            'adhesion_active' => 'boolean',
            'adhesion_montant' => 'nullable|integer|min:0',
            'montant_personnalisable' => 'boolean',
            'periode_debut' => 'nullable|date',
            'periode_fin' => 'nullable|date',
        ]);

        if ($request->filled('periode_debut') || $request->filled('periode_fin')) {
            $currentPeriode = $groupe->periodes()->latest('date_debut')->first();
            if ($currentPeriode) {
                if ($request->filled('periode_debut')) $currentPeriode->date_debut = $request->periode_debut;
                if ($request->filled('periode_fin')) {
                    $currentPeriode->date_fin = $request->periode_fin;
                    $currentPeriode->echeance = $request->periode_fin;
                }
                $currentPeriode->save();
            }
        }

        $groupe->update(\Illuminate\Support\Arr::except($data, ['periode_debut', 'periode_fin']));
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

        if ($groupe->frequence === 'autre') {
            $customDates = collect($groupe->dates_autres ?? [])
                ->map(fn($d) => Carbon::parse($d)->startOfDay())
                ->filter(fn($d) => $d->greaterThanOrEqualTo($start->copy()->startOfDay()))
                ->sort()
                ->values();
            if ($customDates->isNotEmpty()) {
                $end = $customDates->first();
            }
        }

        $nbMembres = max(1, $groupe->membres()->whereIn('statut', ['actif', 'actif_non_verifie'])->count());
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

        $hasPaiements = $groupe->paiements()->where('statut', 'reussi')->exists();
        if ($hasPaiements) {
            return response()->json([
                'message' => 'Impossible de supprimer ce groupe car des paiements ont déjà été effectués.'
            ], 400);
        }

        // Before deleting the group, check if this group is linked to the gestionnaire's unique member card
        $gestionnaireCard = Membre::where('user_id', $groupe->gestionnaire_id)
            ->where('role', 'gestionnaire')
            ->where('groupe_id', $groupe->id)
            ->first();

        if ($gestionnaireCard) {
            // Find another group managed by the same gestionnaire
            $otherGroupe = Groupe::where('gestionnaire_id', $groupe->gestionnaire_id)
                ->where('id', '!=', $groupe->id)
                ->first();

            if ($otherGroupe) {
                // Transfer the card to the other group so it isn't cascade deleted
                $gestionnaireCard->update(['groupe_id' => $otherGroupe->id]);
            } else {
                // If there are no other groups, the card can be deleted safely
                $gestionnaireCard->delete();
            }
        }

        $groupe->delete();
        return response()->json(['message' => 'Groupe supprimé avec succès.']);
    }

    protected function authorizeGroupe(Request $request, Groupe $groupe): void
    {
        abort_unless($groupe->gestionnaire_id === $request->user()->id || $request->user()->role === 'super_admin', 403, 'Accès refusé');
    }
}

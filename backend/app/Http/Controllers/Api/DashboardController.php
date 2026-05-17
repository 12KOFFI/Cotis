<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Groupe;
use App\Models\Paiement;
use App\Models\Membre;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function gestionnaire(Request $request, Groupe $groupe)
    {
        $this->authorizeGroupe($request, $groupe);
        $groupe->ensurePeriodsUpToDate();
        $periode = $groupe->periodes()->latest('date_debut')->first();

        $membres = $groupe->membres;
        $membresActifs = $membres->where('statut', 'actif');
        $nbActifs = $membresActifs->count();

        $totalAttendu = 0;
        $totalRecu = 0;
        $aJour = 0;
        $partiel = 0;
        $enRetard = 0;

        if ($periode) {
            foreach ($membresActifs as $m) {
                $du = $m->montant_perso ?? $groupe->montant_standard;
                $totalAttendu += $du;
                $verse = (int) Paiement::where('membre_id', $m->id)
                    ->where('periode_id', $periode->id)
                    ->where('type', 'cotisation')
                    ->where('statut', 'reussi')->sum('montant');
                $totalRecu += min($verse, $du);
                if ($verse >= $du) $aJour++;
                elseif ($verse > 0) $partiel++;
                elseif (now()->gt($periode->echeance)) $enRetard++;
                else $aJour++;
            }
        }

        $taux = $totalAttendu > 0 ? round(($totalRecu / $totalAttendu) * 100, 1) : 0;

        $dernieresTx = $groupe->paiements()->with('membre')->latest('date_paiement')->limit(5)->get();
        $invitationsEnAttente = $groupe->invitations()->where('statut', 'envoyee')->count();
        $demandesEnAttente = $groupe->paiements()->where('statut', 'en_attente')->whereNull('enregistre_par')->with('membre')->latest('created_at')->get();

        return response()->json([
            'nb_demandes' => $demandesEnAttente->count(),
            'demandes_en_attente' => $demandesEnAttente,
            'periode' => $periode,
            'total_attendu' => $totalAttendu,
            'total_recu' => $totalRecu,
            'taux_collecte' => $taux,
            'a_jour' => $aJour,
            'partiel' => $partiel,
            'en_retard' => $enRetard,
            'nb_membres' => $membres->count(),
            'nb_membres_actifs' => $nbActifs,
            'invitations_en_attente' => $invitationsEnAttente,
            'solde_caisse' => $groupe->caisse->solde ?? 0,
            'dernieres_transactions' => $dernieresTx,
            'has_payments' => $groupe->paiements()->exists(),
        ]);
    }

    public function membre(Request $request, Groupe $groupe)
    {
        $u = $request->user();
        $membre = $groupe->membres()->where('user_id', $u->id)->with('adhesion', 'credits')->first();
        abort_unless($membre, 403);

        // Auto-create adhesion record for members who don't have one yet
        // so the frontend always receives the adhesion status
        if ($groupe->adhesion_active && $groupe->adhesion_montant > 0 && !$membre->adhesion) {
            \App\Models\AdhesionFrais::create([
                'groupe_id' => $groupe->id,
                'membre_id' => $membre->id,
                'montant_du' => $groupe->adhesion_montant,
                'montant_paye' => 0,
                'statut' => 'non_paye',
            ]);
            $membre->load('adhesion'); // reload the relation
        }

        $groupe->ensurePeriodsUpToDate();
        $periode = $groupe->periodes()->latest('date_debut')->first();
        $du = $membre->montant_perso ?? $groupe->montant_standard;
        $totalDu = 0;
        $totalVerse = 0;
        $reste = 0;
        $statut = 'a_jour';
        $periodes = $groupe->periodes()->orderBy('date_debut')->get();
        $hasUnpaid = false;
        foreach ($periodes as $p) {
            $montantDu = $du;
            $montantVerse = (int) Paiement::where('membre_id', $membre->id)
                ->where('periode_id', $p->id)
                ->where('type', 'cotisation')
                ->where('statut', 'reussi')->sum('montant');
            $totalDu += $montantDu;
            $totalVerse += min($montantVerse, $montantDu);
            $manquant = max(0, $montantDu - $montantVerse);
            $reste += $manquant;
            if ($manquant > 0) $hasUnpaid = true;
        }
        if (!$hasUnpaid) $statut = 'a_jour';
        elseif ($totalVerse > 0 && $totalVerse < $totalDu) $statut = 'partiel';
        elseif ($periode && now()->gt($periode->echeance) && $hasUnpaid) $statut = 'en_retard';
        $demandeEnAttente = Paiement::where('membre_id', $membre->id)
            ->where('statut', 'en_attente')
            ->whereNull('enregistre_par')
            ->latest('created_at')
            ->first();

        return response()->json([
            'membre' => $membre,
            'groupe' => $groupe->load('caisse'),
            'periode' => $periode,
            'montant_du' => $totalDu,
            'montant_verse' => $totalVerse,
            'reste_a_payer' => $reste,
            'statut' => $statut,
            'adhesion' => $membre->adhesion,
            'demande_en_attente' => $demandeEnAttente,
            'nb_demandes_en_attente' => $demandeEnAttente ? 1 : 0,
        ]);
    }

    protected function authorizeGroupe(Request $request, Groupe $groupe): void
    {
        $u = $request->user();
        if ($u->role === 'super_admin') return;
        if ($groupe->gestionnaire_id === $u->id) return;
        abort(403);
    }
}

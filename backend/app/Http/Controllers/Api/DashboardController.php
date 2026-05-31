<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Groupe;
use App\Models\Paiement;
use App\Models\Membre;
use App\Models\Periode;
use App\Traits\AuthorizesGroupe;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    use AuthorizesGroupe;

    public function gestionnaire(Request $request, Groupe $groupe)
    {
        $this->authorizeGroupe($request, $groupe);
        $groupe->ensurePeriodsUpToDate();
        $periode = $groupe->periodes()->latest('date_debut')->first();
        $premierePeriode = $groupe->periodes()->oldest('date_debut')->first();

        $membres = $groupe->membres;
        $membresActifs = $membres->whereIn('statut', ['actif', 'actif_non_verifie']);
        $nbActifs = $membresActifs->count();

        $totalAttendu = 0;
        $totalRecu = 0;
        $aJour = 0;
        $enAttente = 0;
        $enRetard = 0;
        $impaye = 0;

        if ($periode) {
            foreach ($membresActifs as $membre) {
                $montantDu = $membre->montant_perso ?? $groupe->montant_standard;
                $totalAttendu += $montantDu;
                $montantVerse = (int) Paiement::cotisationReussie($membre->id, $periode->id)->sum('montant');
                $totalRecu += min($montantVerse, $montantDu);

                $statut = $membre->computeStatutCotisation($groupe);
                match ($statut) {
                    'a_jour'     => $aJour++,
                    'en_attente' => $enAttente++,
                    'en_retard'  => $enRetard++,
                    'impaye'     => $impaye++,
                    default      => null,
                };
            }
        }

        $tauxCollecte = $totalAttendu > 0 ? round(($totalRecu / $totalAttendu) * 100, 1) : 0;

        $dernieresTransactions = $groupe->paiements()->with('membre')->latest('created_at')->limit(5)->get();
        $invitationsEnAttente = $groupe->invitations()->where('statut', 'envoyee')->count();

        return response()->json([
            'nb_demandes'             => 0,
            'demandes_en_attente'     => [],
            'periode'                 => $periode,
            'total_attendu'           => $totalAttendu,
            'total_recu'              => $totalRecu,
            'taux_collecte'           => $tauxCollecte,
            'a_jour'                  => $aJour,
            'en_attente'              => $enAttente,
            'en_retard'               => $enRetard,
            'impaye'                  => $impaye,
            'nb_membres'              => $membres->count(),
            'nb_membres_actifs'       => $nbActifs,
            'invitations_en_attente'  => $invitationsEnAttente,
            'solde_caisse'            => $groupe->caisse ? $groupe->caisse->solde_total : 0,
            'solde_disponible'        => $groupe->caisse ? $groupe->caisse->solde_disponible : 0,
            'dernieres_transactions'  => $dernieresTransactions,
            'has_payments'            => $groupe->paiements()->exists(),
            'date_debut_cotisations'  => $premierePeriode ? $premierePeriode->date_debut : null,
        ]);
    }

    public function membre(Request $request, Groupe $groupe)
    {
        $currentUser = $request->user();
        $membre = $groupe->membres()->where('user_id', $currentUser->id)->with('adhesion', 'credits')->first();
        abort_unless($membre, 403);

        // Auto-create adhesion record for members who don't have one yet
        // so the frontend always receives the adhesion status
        if ($groupe->adhesion_active && $groupe->adhesion_montant > 0 && !$membre->adhesion) {
            \App\Models\AdhesionFrais::create([
                'groupe_id'    => $groupe->id,
                'membre_id'    => $membre->id,
                'montant_du'   => $groupe->adhesion_montant,
                'montant_paye' => 0,
                'statut'       => 'non_paye',
            ]);
            $membre->load('adhesion');
        }

        $groupe->ensurePeriodsUpToDate();
        $periode = $groupe->periodes()->latest('date_debut')->first();
        $montantDu = $membre->montant_perso ?? $groupe->montant_standard;
        $totalDu = 0;
        $totalVerse = 0;
        $reste = 0;

        $periodes = $groupe->periodes()->orderBy('date_debut')->get();
        foreach ($periodes as $p) {
            $totalDu += $montantDu;
            $montantVerse = (int) Paiement::cotisationReussie($membre->id, $p->id)->sum('montant');
            $totalVerse += min($montantVerse, $montantDu);
            $reste += max(0, $montantDu - $montantVerse);
        }

        // Utilise la méthode centralisée du modèle Membre
        $statut = $membre->computeStatutCotisation($groupe);

        return response()->json([
            'membre'                   => $membre,
            'groupe'                   => $groupe->load('caisse'),
            'periode'                  => $periode,
            'montant_du'               => $totalDu,
            'montant_verse'            => $totalVerse,
            'reste_a_payer'            => $reste,
            'statut'                   => $statut,
            'adhesion'                 => $membre->adhesion,
            'demande_en_attente'       => null,
            'nb_demandes_en_attente'   => 0,
        ]);
    }

}

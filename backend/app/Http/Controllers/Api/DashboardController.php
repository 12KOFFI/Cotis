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

        return response()->json([
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
        ]);
    }

    public function membre(Request $request, Groupe $groupe)
    {
        $u = $request->user();
        $membre = $groupe->membres()->where('user_id', $u->id)->with('adhesion', 'credits')->first();
        abort_unless($membre, 403);
        $periode = $groupe->periodes()->latest('date_debut')->first();
        $du = $membre->montant_perso ?? $groupe->montant_standard;
        $verse = $periode ? (int) Paiement::where('membre_id', $membre->id)
            ->where('periode_id', $periode->id)
            ->where('type', 'cotisation')
            ->where('statut', 'reussi')->sum('montant') : 0;
        $reste = max(0, $du - $verse);
        $statut = 'a_jour';
        if ($verse >= $du) $statut = 'a_jour';
        elseif ($verse > 0) $statut = 'partiel';
        elseif ($periode && now()->gt($periode->echeance)) $statut = 'en_retard';
        else $statut = 'a_jour';
        return response()->json([
            'membre' => $membre,
            'groupe' => $groupe->load('caisse'),
            'periode' => $periode,
            'montant_du' => $du,
            'montant_verse' => $verse,
            'reste_a_payer' => $reste,
            'statut' => $statut,
            'adhesion' => $membre->adhesion,
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

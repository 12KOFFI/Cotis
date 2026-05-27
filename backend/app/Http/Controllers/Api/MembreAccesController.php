<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Membre;
use App\Models\Paiement;
use Illuminate\Http\Request;

class MembreAccesController extends Controller
{
    /**
     * Validate access token and return member dashboard data (read-only).
     * This endpoint is PUBLIC — no authentication required.
     */
    public function show(string $token)
    {
        $membre = Membre::where('access_token', $token)
            ->with('adhesion', 'credits', 'groupe.caisse')
            ->first();

        abort_unless($membre, 404, 'Lien invalide ou expiré.');

        $groupe = $membre->groupe;
        $groupe->ensurePeriodsUpToDate();

        $periode = $groupe->periodes()->latest('date_debut')->first();
        $du = $membre->montant_perso ?? $groupe->montant_standard;

        $totalDu = 0;
        $totalVerse = 0;
        $reste = 0;
        $statut = 'en_attente';
        $periodes = $groupe->periodes()->orderBy('date_debut')->get();
        $hasUnpaid = false;
        $hasLatePayment = false;
        $hasPartialPayment = false;

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
            if ($manquant > 0) {
                $hasUnpaid = true;
                if ($montantVerse > 0) {
                    $hasPartialPayment = true;
                }
            }
            $hasLate = Paiement::where('membre_id', $membre->id)
                ->where('periode_id', $p->id)
                ->where('type', 'cotisation')
                ->where('statut', 'reussi')
                ->where('date_paiement', '>', $p->echeance)
                ->exists();
            if ($hasLate) {
                $hasLatePayment = true;
            }
        }

        if (!$hasUnpaid) {
            $statut = $hasLatePayment ? 'en_retard' : 'a_jour';
        } elseif ($hasPartialPayment) {
            $statut = ($periode && now()->gt($periode->echeance)) ? 'en_retard' : 'partiel';
        } else {
            $statut = ($periode && now()->gt($periode->echeance)) ? 'impaye' : 'en_attente';
        }

        // Get recent payments
        $paiements = Paiement::where('membre_id', $membre->id)
            ->with('periode')
            ->latest('date_paiement')
            ->limit(20)
            ->get();

        return response()->json([
            'membre' => $membre->only(['id', 'nom', 'prenom', 'telephone', 'email', 'role', 'statut', 'full_name']),
            'groupe' => [
                'id' => $groupe->id,
                'nom' => $groupe->nom,
                'logo' => $groupe->logo,
                'type' => $groupe->type,
                'devise' => $groupe->devise,
                'wave_numero' => $groupe->wave_numero,
            ],
            'periode' => $periode,
            'montant_du' => $totalDu,
            'montant_verse' => $totalVerse,
            'reste_a_payer' => $reste,
            'statut' => $statut,
            'adhesion' => $membre->adhesion,
            'paiements' => $paiements,
        ]);
    }
}

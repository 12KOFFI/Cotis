<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Groupe;
use App\Models\CaisseLedger;
use App\Services\Payment\PayoutService;
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

    /**
     * TÂCHE 3 — Calcul des frais en temps réel.
     * Endpoint GET léger, sans side-effect, pour l'affichage live.
     */
    public function calculateFees(Request $request, Groupe $groupe)
    {
        $this->authorizeGroupe($request, $groupe);

        $amount = (int) $request->query('amount', 0);
        abort_if($amount < 500, 422, 'Montant minimum : 500 FCFA.');

        $service = app(PayoutService::class);
        $fees    = $service->calculateFees($amount);

        return response()->json($fees->toArray());
    }

    /**
     * TÂCHE 2 — Payout instantané via GeniusPay (retrait Wave).
     * Le gestionnaire paie les frais. Aucune validation admin requise.
     */
    public function payout(Request $request, Groupe $groupe)
    {
        $this->authorizeGroupe($request, $groupe);

        $data = $request->validate([
            'montant'          => 'required|integer|min:500',
            'recipient_phone'  => 'required|string|min:10|max:30',
            'recipient_name'   => 'required|string|max:200',
        ]);

        $service = app(PayoutService::class);

        $payout = $service->executePayout(
            groupe:         $groupe,
            userId:         $request->user()->id,
            recipientPhone: $data['recipient_phone'],
            recipientName:  $data['recipient_name'],
            grossAmount:    $data['montant'],
        );

        // Réponse adaptée au statut
        $status = $payout->status;

        if ($status === 'paid' || $status === 'completed') {
            $caisse = $groupe->caisse;
            $agg    = $caisse ? $caisse->aggregats() : [];

            return response()->json([
                'success'          => true,
                'message'          => 'Retrait effectué avec succès !',
                'payout'           => $payout,
                'solde_total'      => $agg['solde_total'] ?? 0,
                'solde_disponible' => $agg['solde_disponible'] ?? 0,
            ]);
        }

        if ($status === 'pending') {
            return response()->json([
                'success' => true,
                'message' => 'Retrait en cours de traitement. Vous recevrez une notification.',
                'payout'  => $payout,
            ]);
        }

        // Échec
        $friendlyMessages = [
            'INSUFFICIENT_MERCHANT_BALANCE' => 'Service momentanément indisponible. Réessayez plus tard.',
            'RECIPIENT_LIMIT_EXCEEDED'      => 'Le compte Wave ne peut pas recevoir de fonds actuellement (plafond atteint).',
            'IDEMPOTENCY_VIOLATION'         => 'Demande déjà en cours de traitement.',
            'INVALID_PHONE_FORMAT'          => 'Le format du numéro mobile money saisi est incorrect.',
        ];

        $msg = $friendlyMessages[$payout->failure_code] ?? $payout->failure_reason ?? 'Le retrait a échoué. Veuillez réessayer.';

        return response()->json([
            'success'        => false,
            'message'        => $msg,
            'failure_code'   => $payout->failure_code,
            'payout'         => $payout,
        ], 422);
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

<?php

namespace App\Services\Payment;

use App\DTOs\Payment\FeeCalculation;
use App\DTOs\Payment\PayoutRequest as PayoutRequestDTO;
use App\Models\CaisseLedger;
use App\Models\Groupe;
use App\Models\Payout;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Service Layer — Orchestration des payouts.
 *
 * Responsabilités :
 * 1. Validation métier (appartenance groupe, solde, montants)
 * 2. Calcul des frais (centralisé via FeeCalculation DTO)
 * 3. Génération de la clé d'idempotence
 * 4. Appel au provider via PaymentProviderFactory
 * 5. Enregistrement local (payout + ledger) dans une transaction DB
 * 6. Audit log
 */
class PayoutService
{
    /**
     * Calcule les frais pour un montant brut donné.
     * Source de vérité unique — le frontend ne fait JAMAIS ce calcul.
     */
    public function calculateFees(int $grossAmount): FeeCalculation
    {
        return FeeCalculation::fromGross($grossAmount);
    }

    /**
     * Exécute un payout complet : validation → frais → API → enregistrement.
     *
     * @throws \Illuminate\Http\Exceptions\HttpResponseException
     */
    public function executePayout(
        Groupe $groupe,
        int    $userId,
        string $recipientPhone,
        string $recipientName,
        int    $grossAmount
    ): Payout {
        // ── 1. VALIDATIONS MÉTIER ──────────────────────────────────

        // 1a. Montant minimum
        abort_if($grossAmount < 500, 422, 'Le montant minimum de retrait est de 500 FCFA.');

        // 1b. Vérifier que le groupe a une caisse
        $caisse = $groupe->caisse;
        abort_unless($caisse, 422, 'Caisse introuvable pour ce groupe.');

        // 1c. Vérifier le solde disponible (retirable via Wave uniquement)
        $soldeDisponible = $caisse->solde_disponible;
        abort_if(
            $soldeDisponible < $grossAmount,
            422,
            "Solde Wave insuffisant. Disponible : {$soldeDisponible} FCFA, demandé : {$grossAmount} FCFA."
        );

        // 1d. Format téléphone E.164
        $cleanPhone = preg_replace('/[^+0-9]/', '', $recipientPhone);
        abort_if(
            strlen($cleanPhone) < 10 || !str_starts_with($cleanPhone, '+'),
            422,
            'Le numéro de téléphone doit être au format international (ex: +225 07 00 00 00 00).'
        );

        // 1e. Anti-flood : pas plus de 3 payouts pending simultanés par groupe
        $pendingCount = Payout::where('groupe_id', $groupe->id)
            ->where('status', 'pending')
            ->where('created_at', '>=', now()->subMinutes(10))
            ->count();
        abort_if($pendingCount >= 3, 429, 'Trop de retraits en cours. Veuillez patienter.');

        // ── 2. CALCUL DES FRAIS ────────────────────────────────────

        $fees = $this->calculateFees($grossAmount);

        // ── 3. IDEMPOTENCY KEY ─────────────────────────────────────

        $idempotencyKey = 'payout_' . $groupe->id . '_' . now()->format('Ymd_His') . '_' . Str::random(8);

        // ── 4. RÉSOLUTION DU WALLET ────────────────────────────────

        $walletId = null;
        try {
            $merchant = PaymentProviderFactory::merchant();
            $wallets  = $merchant->getWallets();
            // Prendre le premier wallet actif de type payout
            foreach ($wallets as $w) {
                if ($w->status === 'active' && $w->type === 'payout') {
                    $walletId = $w->id;
                    break;
                }
            }
            // Fallback : premier wallet actif
            if (!$walletId) {
                foreach ($wallets as $w) {
                    if ($w->status === 'active') {
                        $walletId = $w->id;
                        break;
                    }
                }
            }
        } catch (\Exception $e) {
            Log::error('PayoutService: impossible de récupérer les wallets', ['error' => $e->getMessage()]);
        }

        abort_unless($walletId, 503, 'Aucun wallet GeniusPay actif disponible. Réessayez plus tard.');

        // ── 5. EXÉCUTION (transaction DB + appel API) ──────────────

        return DB::transaction(function () use (
            $groupe, $userId, $cleanPhone, $recipientName,
            $grossAmount, $fees, $idempotencyKey, $walletId
        ) {
            // 5a. Créer l'enregistrement local AVANT l'appel API (statut pending)
            $payout = Payout::create([
                'groupe_id'             => $groupe->id,
                'user_id'               => $userId,
                'amount'                => $grossAmount,
                'gateway_fees'          => $fees->gatewayFees,
                'platform_commission'   => $fees->platformCommission,
                'net_amount'            => $fees->netAmount,
                'recipient_phone'       => $cleanPhone,
                'recipient_name'        => $recipientName,
                'destination_provider'  => 'wave',
                'wallet_id'             => $walletId,
                'idempotency_key'       => $idempotencyKey,
                'status'                => 'pending',
            ]);

            // 5b. Appeler le provider
            try {
                $payoutProvider = PaymentProviderFactory::payout();

                $dto = new PayoutRequestDTO(
                    walletId:            $walletId,
                    recipientName:       $recipientName,
                    recipientPhone:      $cleanPhone,
                    amount:              $grossAmount,
                    idempotencyKey:      $idempotencyKey,
                    description:         "Retrait caisse — {$groupe->nom}",
                    destinationProvider: 'wave',
                    destinationAccount:  $cleanPhone,
                );

                $result = $payoutProvider->executePayout($dto);

                // 5c. Mettre à jour le payout local
                $payout->update([
                    'status'              => $result->success ? $result->status : 'failed',
                    'provider_reference'  => $result->reference,
                    'failure_reason'      => $result->failureReason,
                    'failure_code'        => $result->failureCode,
                ]);

                // 5d. Si succès ou pending → enregistrer la sortie dans le ledger
                if ($result->success) {
                    CaisseLedger::create([
                        'caisse_id'   => $groupe->caisse->id,
                        'groupe_id'   => $groupe->id,
                        'type'        => 'sortie',
                        'montant'     => $grossAmount,
                        'motif'       => 'Retrait Wave — ' . $cleanPhone,
                        'beneficiaire'=> $recipientName,
                        'date'        => now()->toDateString(),
                        'auteur_id'   => $payout->user_id,
                    ]);

                    Log::info('PayoutService: payout réussi', [
                        'payout_id' => $payout->id,
                        'reference' => $result->reference,
                        'amount'    => $grossAmount,
                        'net'       => $fees->netAmount,
                    ]);
                } else {
                    Log::warning('PayoutService: payout échoué', [
                        'payout_id'      => $payout->id,
                        'failure_code'   => $result->failureCode,
                        'failure_reason' => $result->failureReason,
                    ]);
                }

            } catch (\Exception $e) {
                $payout->update([
                    'status'         => 'failed',
                    'failure_reason' => $e->getMessage(),
                    'failure_code'   => 'EXCEPTION',
                ]);

                Log::error('PayoutService: exception pendant le payout', [
                    'payout_id' => $payout->id,
                    'error'     => $e->getMessage(),
                ]);
            }

            return $payout->fresh();
        });
    }
}

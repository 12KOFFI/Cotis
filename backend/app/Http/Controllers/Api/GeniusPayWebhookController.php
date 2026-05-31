<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Paiement;
use App\Models\Payout;
use App\Models\Groupe;
use App\Models\Membre;
use App\Models\CaisseLedger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class GeniusPayWebhookController extends Controller
{
    public function handle(Request $request)
    {
        // 1) Signature HMAC GeniusPay
        $secret    = config('services.geniuspay.webhook_secret', '');
        $signature = $request->header('X-Webhook-Signature') ?? '';
        $timestamp = $request->header('X-Webhook-Timestamp') ?? '';
        $payload   = $request->getContent();

        abort_unless($secret, 500, 'Webhook secret not configured in production');

        $dataToSign = $timestamp . '.' . $payload;
        $expected   = hash_hmac('sha256', $dataToSign, $secret);
        if (!hash_equals($expected, $signature)) {
            Log::warning('GeniusPay webhook: signature invalide');
            return response()->json(['ok' => false, 'message' => 'Signature invalide'], 400);
        }

        $data  = $request->json()->all();
        $event = $request->header('X-Webhook-Event') ?? $data['event'] ?? '';

        Log::info("GeniusPay Webhook reçu [{$event}]", ['data' => $data]);

        // --- PAYOUT (CASHOUT) EVENTS --- TÂCHE 9
        if (in_array($event, ['payout.completed', 'payout.failed', 'cashout.completed', 'cashout.failed', 'cashout.requested'])) {
            return $this->handlePayoutWebhook($event, $data);
        }

        // --- PAYMENT FAILURE EVENTS ---
        if (in_array($event, ['payment.failed', 'payment.cancelled', 'payment.expired'])) {
            return $this->handlePaymentFailure($event, $data);
        }

        // --- PAYMENT SUCCESS ---
        if ($event === 'payment.success') {
            return $this->handlePaymentSuccess($data);
        }

        return response()->json(['ok' => true, 'message' => 'Evenement ignore']);
    }

    /* ================================================================ */
    /*  TÂCHE 9 — Payout/Cashout Webhook Handler                        */
    /* ================================================================ */

    /**
     * Gère les webhooks de payout (cashout) GeniusPay.
     *
     * Événements supportés :
     * - payout.completed / cashout.completed → Marque le payout comme payé
     * - payout.failed / cashout.failed       → Marque comme échoué + restitution fonds
     *
     * Résolution du Payout local :
     * 1. Par provider_reference (ID retourné par GeniusPay)
     * 2. Par idempotency_key (dans les metadata)
     * 3. Par combinaison montant + téléphone + statut pending
     */
    private function handlePayoutWebhook(string $event, array $data)
    {
        $payoutData = $data['data']['payout'] ?? $data['data'] ?? [];
        $reference  = $payoutData['id'] ?? $payoutData['reference'] ?? null;
        $amount     = (int) ($payoutData['amount'] ?? 0);
        $metadata   = $payoutData['metadata'] ?? $data['metadata'] ?? [];
        $failCode   = $payoutData['failure_code'] ?? $payoutData['error_code'] ?? $data['failure_code'] ?? null;
        $failReason = $payoutData['failure_reason'] ?? $payoutData['error_message'] ?? $data['failure_reason'] ?? null;

        // ── Résolution du Payout local ──────────────────────────────

        $payout = $this->resolveLocalPayout($reference, $metadata, $amount);

        if (!$payout) {
            Log::warning("GeniusPay Webhook [{$event}]: payout local introuvable", [
                'reference'  => $reference,
                'metadata'   => $metadata,
                'amount'     => $amount,
            ]);
            // Retourner 200 pour éviter les re-tentatives infinies
            return response()->json(['ok' => true, 'message' => 'Payout local introuvable, ignoré']);
        }

        // ── Idempotence : ne pas retraiter un payout déjà finalisé ──
        if (in_array($payout->status, ['paid', 'completed', 'failed', 'cancelled'])) {
            Log::info("GeniusPay Webhook [{$event}]: payout #{$payout->id} déjà finalisé ({$payout->status}), ignoré");
            return response()->json(['ok' => true, 'idempotent' => true]);
        }

        // ── Traitement par événement ────────────────────────────────

        $isCompleted = in_array($event, ['payout.completed', 'cashout.completed']);
        $isFailed    = in_array($event, ['payout.failed', 'cashout.failed']);

        if ($isCompleted) {
            return $this->handlePayoutCompleted($payout, $reference);
        }

        if ($isFailed) {
            return $this->handlePayoutFailed($payout, $failCode, $failReason);
        }

        // cashout.requested — simple log, pas de changement de statut
        Log::info("GeniusPay Webhook [{$event}]: payout #{$payout->id} en cours de traitement");
        return response()->json(['ok' => true, 'message' => 'Acknowledged']);
    }

    /**
     * Payout confirmé par GeniusPay → marquer comme payé.
     * Si le ledger n'a pas encore été mis à jour (cas webhook-first), créer l'entrée.
     */
    private function handlePayoutCompleted(Payout $payout, ?string $reference)
    {
        DB::transaction(function () use ($payout, $reference) {
            $payout->update([
                'status'             => 'paid',
                'provider_reference' => $reference ?? $payout->provider_reference,
                'failure_reason'     => null,
                'failure_code'       => null,
            ]);

            // Vérifier si l'entrée ledger existe déjà (idempotence)
            $motif = 'Retrait Wave — ' . $payout->recipient_phone;
            $ledgerExists = CaisseLedger::where('groupe_id', $payout->groupe_id)
                ->where('type', 'sortie')
                ->where('motif', $motif)
                ->where('montant', $payout->amount)
                ->exists();

            if (!$ledgerExists) {
                $groupe = Groupe::find($payout->groupe_id);
                if ($groupe?->caisse) {
                    CaisseLedger::create([
                        'caisse_id' => $groupe->caisse->id,
                        'groupe_id' => $payout->groupe_id,
                        'type'      => 'sortie',
                        'montant'   => $payout->amount,
                        'motif'     => $motif,
                        'beneficiaire' => $payout->recipient_name,
                        'date'      => now()->toDateString(),
                        'auteur_id' => $payout->user_id,
                    ]);
                }
            }
        });

        Log::info("GeniusPay Webhook: payout #{$payout->id} confirmé (paid)", [
            'amount'    => $payout->amount,
            'reference' => $reference,
        ]);

        return response()->json(['ok' => true, 'message' => 'Payout marked as paid']);
    }

    /**
     * Payout échoué → mettre à jour le statut + restituer les fonds dans le ledger.
     *
     * Codes d'erreur documentés (GeniusPay) :
     * - INSUFFICIENT_MERCHANT_BALANCE : Solde marchand insuffisant
     * - RECIPIENT_LIMIT_EXCEEDED      : Plafond Wave du destinataire atteint
     * - INVALID_PHONE_FORMAT          : Numéro au mauvais format
     * - RECIPIENT_NOT_FOUND           : Compte Wave introuvable
     * - PROVIDER_TIMEOUT              : Timeout opérateur
     * - PROVIDER_ERROR                : Erreur réseau opérateur
     * - COMPLIANCE_BLOCKED            : Transaction bloquée par la conformité
     * - DUPLICATE_TRANSACTION         : Transaction déjà traitée
     */
    private function handlePayoutFailed(Payout $payout, ?string $failCode, ?string $failReason)
    {
        // Construire un message de raison clair si absent
        $reasonMap = [
            'INSUFFICIENT_MERCHANT_BALANCE' => 'Solde du compte marchand GeniusPay insuffisant pour effectuer ce retrait.',
            'RECIPIENT_LIMIT_EXCEEDED'      => 'Le compte Wave du destinataire a atteint son plafond de réception.',
            'INVALID_PHONE_FORMAT'          => 'Le numéro de téléphone du destinataire est dans un format invalide.',
            'RECIPIENT_NOT_FOUND'           => 'Le compte Wave du destinataire est introuvable ou inactif.',
            'PROVIDER_TIMEOUT'              => 'Délai d\'attente dépassé avec l\'opérateur Wave. Réessayez plus tard.',
            'PROVIDER_ERROR'                => 'Erreur temporaire du réseau Wave. Le retrait n\'a pas été effectué.',
            'COMPLIANCE_BLOCKED'            => 'Transaction bloquée par les règles de conformité.',
            'DUPLICATE_TRANSACTION'         => 'Cette transaction a déjà été traitée.',
        ];

        $humanReason = $failReason ?: ($reasonMap[$failCode] ?? 'Échec du retrait pour une raison inconnue.');

        DB::transaction(function () use ($payout, $failCode, $humanReason) {
            // 1. Mettre à jour le payout
            $payout->update([
                'status'         => 'failed',
                'failure_code'   => $failCode,
                'failure_reason' => $humanReason,
            ]);

            // 2. Restitution logique des fonds : supprimer la sortie du ledger
            //    si elle avait été créée de manière optimiste lors de l'appel API
            $motif = 'Retrait Wave — ' . $payout->recipient_phone;
            $ledgerEntry = CaisseLedger::where('groupe_id', $payout->groupe_id)
                ->where('type', 'sortie')
                ->where('motif', $motif)
                ->where('montant', $payout->amount)
                ->latest()
                ->first();

            if ($ledgerEntry) {
                // Créer une entrée de restitution (plutôt que supprimer, pour l'audit trail)
                CaisseLedger::create([
                    'caisse_id'    => $ledgerEntry->caisse_id,
                    'groupe_id'    => $payout->groupe_id,
                    'type'         => 'entree',
                    'montant'      => $payout->amount,
                    'motif'        => "Restitution — Retrait échoué ({$failCode}) — {$payout->recipient_phone}",
                    'beneficiaire' => $payout->recipient_name,
                    'date'         => now()->toDateString(),
                    'auteur_id'    => $payout->user_id,
                ]);

                Log::info("GeniusPay Webhook: restitution ledger pour payout #{$payout->id}", [
                    'amount'     => $payout->amount,
                    'fail_code'  => $failCode,
                ]);
            }
        });

        Log::warning("GeniusPay Webhook: payout #{$payout->id} échoué", [
            'failure_code'   => $failCode,
            'failure_reason' => $humanReason,
            'amount'         => $payout->amount,
            'recipient'      => $payout->recipient_phone,
        ]);

        return response()->json(['ok' => true, 'message' => 'Payout marked as failed, funds restored']);
    }

    /* ================================================================ */
    /*  Résolution du Payout local                                       */
    /* ================================================================ */

    /**
     * Tente de retrouver le Payout local correspondant au webhook.
     * Stratégie en cascade : référence → idempotency_key → montant+téléphone.
     */
    private function resolveLocalPayout(?string $reference, array $metadata, int $amount): ?Payout
    {
        // 1. Par provider_reference
        if ($reference) {
            $payout = Payout::where('provider_reference', $reference)->first();
            if ($payout) return $payout;
        }

        // 2. Par idempotency_key (dans metadata envoyée lors du payout)
        $idempotencyKey = $metadata['idempotency_key'] ?? null;
        if ($idempotencyKey) {
            $payout = Payout::where('idempotency_key', $idempotencyKey)->first();
            if ($payout) return $payout;
        }

        // 3. Par combinaison montant + groupe_id + statut pending (dernière tentative)
        $groupeId = (int) ($metadata['groupe_id'] ?? 0);
        if ($groupeId > 0 && $amount > 0) {
            return Payout::where('groupe_id', $groupeId)
                ->where('amount', $amount)
                ->where('status', 'pending')
                ->latest()
                ->first();
        }

        return null;
    }

    /* ================================================================ */
    /*  Handlers de paiement (existants, inchangés)                      */
    /* ================================================================ */

    private function handlePaymentFailure(string $event, array $data)
    {
        $paymentData   = $data['data']['payment'] ?? $data['data'] ?? [];
        $transactionId = $paymentData['id'] ?? $data['transaction_id'] ?? null;

        if (!$transactionId) {
            return response()->json(['ok' => false, 'message' => 'ID de transaction manquant'], 422);
        }

        $statusMap = [
            'payment.failed'    => 'echoue',
            'payment.cancelled' => 'annule',
            'payment.expired'   => 'echoue',
        ];
        $newStatus = $statusMap[$event] ?? 'echoue';

        $paiement = Paiement::where('transaction_id', $transactionId)->first();
        if ($paiement) {
            $paiement->update([
                'statut' => $newStatus,
                'note'   => null, // Pas de message technique visible par le membre
            ]);
            Log::info("GeniusPay Webhook: statut du paiement {$transactionId} mis à jour vers [{$newStatus}] (événement: {$event})");
        } else {
            Log::warning("GeniusPay Webhook: paiement {$transactionId} non trouvé pour mise à jour de statut");
        }

        return response()->json(['ok' => true, 'message' => 'Statut de paiement mis à jour']);
    }

    private function handlePaymentSuccess(array $data)
    {
        $paymentData   = $data['data']['payment'] ?? $data['data'] ?? [];
        $transactionId = $paymentData['id'] ?? $data['transaction_id'] ?? null;

        if (!$transactionId) {
            return response()->json(['ok' => false, 'message' => 'ID de transaction manquant'], 422);
        }

        // Idempotence (si déjà marqué reussi)
        if (Paiement::where('transaction_id', $transactionId)->where('statut', 'reussi')->exists()) {
            return response()->json(['ok' => true, 'idempotent' => true]);
        }

        $metadata  = $paymentData['metadata'] ?? $data['metadata'] ?? [];
        $groupeId  = (int) ($metadata['groupe_id'] ?? 0);
        $membreId  = (int) ($metadata['membre_id'] ?? 0);
        $montant   = (int) ($metadata['montant'] ?? $paymentData['amount'] ?? 0);
        $frais     = (int) ($metadata['frais'] ?? 0);
        $type      = $metadata['type'] ?? 'cotisation';

        $groupe = Groupe::find($groupeId);
        $membre = Membre::find($membreId);

        if (!$groupe || !$membre || $montant <= 0) {
            Log::warning('GeniusPay webhook: donnees invalides', [
                'groupe_id' => $groupeId,
                'membre_id' => $membreId,
                'montant'   => $montant,
            ]);
            return response()->json(['ok' => false, 'message' => 'Donnees associees introuvables'], 422);
        }

        try {
            app(PaiementController::class)->enregistrerPaiementConfirme($groupe, $membre, $type, $montant, $transactionId);
            
            return response()->json(['ok' => true]);
        } catch (\Throwable $exception) {
            Log::error('GeniusPay webhook: erreur lors du traitement', [
                'transaction_id' => $transactionId,
                'error'          => $exception->getMessage(),
            ]);
            // Retourner 200 pour éviter les re-tentatives infinies de GeniusPay
            return response()->json(['ok' => false, 'message' => 'Erreur interne'], 200);
        }
    }
}

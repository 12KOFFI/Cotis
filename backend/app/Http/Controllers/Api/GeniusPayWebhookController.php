<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Paiement;
use App\Models\Groupe;
use App\Models\Membre;
use App\Models\CaisseLedger;
use Illuminate\Http\Request;
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

        // --- TRAITEMENT DES CASHOUTS ---
        if (in_array($event, ['cashout.requested', 'cashout.completed', 'cashout.failed'])) {
            return $this->handleCashout($event, $data);
        }

        // --- TRAITEMENT DES ÉCHECS ET ANNULATIONS DE PAIEMENT ---
        if (in_array($event, ['payment.failed', 'payment.cancelled', 'payment.expired'])) {
            return $this->handlePaymentFailure($event, $data);
        }

        // --- TRAITEMENT DU PAIEMENT RÉUSSI ---
        if ($event !== 'payment.success') {
            return response()->json(['ok' => true, 'message' => 'Evenement ignore']);
        }

        return $this->handlePaymentSuccess($data);
    }

    /* ------------------------------------------------------------------ */
    /*  Handlers privés                                                    */
    /* ------------------------------------------------------------------ */

    private function handleCashout(string $event, array $data)
    {
        $payoutData = $data['data']['payout'] ?? $data['data'] ?? [];
        $payoutId   = $payoutData['id'] ?? null;
        $amount     = (int) ($payoutData['amount'] ?? 0);
        $metadata   = $payoutData['metadata'] ?? $data['metadata'] ?? [];
        $groupeId   = (int) ($metadata['groupe_id'] ?? 0);

        Log::info("GeniusPay Webhook cashout [{$event}]", [
            'payout_id' => $payoutId,
            'amount'    => $amount,
            'groupe_id' => $groupeId,
        ]);

        if ($event === 'cashout.completed' && $groupeId > 0) {
            $motifId = 'Retrait GeniusPay - ID: ' . $payoutId;

            // Idempotence : Ne pas dupliquer la sortie si le webhook est rejoué
            if (CaisseLedger::where('motif', $motifId)->exists()) {
                return response()->json(['ok' => true, 'idempotent' => true]);
            }

            $groupe = Groupe::find($groupeId);
            if ($groupe?->caisse) {
                CaisseLedger::create([
                    'caisse_id' => $groupe->caisse->id,
                    'groupe_id' => $groupe->id,
                    'type'      => 'sortie',
                    'montant'   => $amount,
                    'motif'     => $motifId,
                    'date'      => now()->toDateString(),
                ]);
            }
        }

        return response()->json(['ok' => true, 'message' => 'Cashout processed']);
    }

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
                'note'   => 'Paiement Genius Pay mis à jour via webhook : ' . $event,
            ]);
            Log::info("GeniusPay Webhook: statut du paiement {$transactionId} mis à jour vers [{$newStatus}]");
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

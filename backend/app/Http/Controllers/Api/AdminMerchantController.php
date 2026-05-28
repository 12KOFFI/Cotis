<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Payment\PaymentProviderFactory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * TÂCHE 1 — Dashboard Admin Merchant.
 * Expose les données GeniusPay (solde, wallets, transactions, payouts)
 * au super_admin via l'Architecture Provider/Adapter.
 */
class AdminMerchantController extends Controller
{
    /**
     * Vue consolidée pour le dashboard admin.
     * Récupère balance + wallets en une seule requête (cachées 60s).
     */
    public function dashboard(Request $request)
    {
        $this->ensure($request);

        try {
            $merchant = PaymentProviderFactory::merchant();

            $balance = $merchant->getBalance();
            $wallets = $merchant->getWallets();

            return response()->json([
                'balance' => $balance->toArray(),
                'wallets' => array_map(fn($w) => $w->toArray(), $wallets),
            ]);
        } catch (\Exception $e) {
            Log::error('AdminMerchantController@dashboard: erreur GeniusPay', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'error'   => true,
                'message' => 'Impossible de contacter GeniusPay. ' . $e->getMessage(),
                'balance' => null,
                'wallets' => [],
            ], 503);
        }
    }

    /**
     * Historique des payouts avec filtres.
     */
    public function payouts(Request $request)
    {
        $this->ensure($request);

        try {
            $merchant = PaymentProviderFactory::merchant();

            $result = $merchant->listPayouts([
                'status' => $request->query('status'),
                'from'   => $request->query('from'),
                'to'     => $request->query('to'),
                'limit'  => (int) $request->query('limit', 20),
            ]);

            return response()->json($result);
        } catch (\Exception $e) {
            Log::error('AdminMerchantController@payouts: erreur', ['error' => $e->getMessage()]);
            return response()->json(['error' => true, 'message' => $e->getMessage(), 'data' => [], 'meta' => []], 503);
        }
    }

    /**
     * Détails d'un payout spécifique par sa référence.
     */
    public function payoutDetails(Request $request, string $reference)
    {
        $this->ensure($request);

        try {
            $merchant = PaymentProviderFactory::merchant();
            $details  = $merchant->getPayoutDetails($reference);

            if (!$details) {
                return response()->json(['error' => true, 'message' => 'Payout introuvable.'], 404);
            }

            return response()->json(['data' => $details]);
        } catch (\Exception $e) {
            Log::error('AdminMerchantController@payoutDetails: erreur', ['reference' => $reference, 'error' => $e->getMessage()]);
            return response()->json(['error' => true, 'message' => $e->getMessage()], 503);
        }
    }

    /**
     * Détails d'une transaction de paiement par sa référence (MTX-...).
     */
    public function transactionDetails(Request $request, string $reference)
    {
        $this->ensure($request);

        try {
            $merchant    = PaymentProviderFactory::merchant();
            $transaction = $merchant->getTransaction($reference);

            if (!$transaction) {
                return response()->json(['error' => true, 'message' => 'Transaction introuvable.'], 404);
            }

            return response()->json(['data' => $transaction->toArray()]);
        } catch (\Exception $e) {
            Log::error('AdminMerchantController@transactionDetails: erreur', ['reference' => $reference, 'error' => $e->getMessage()]);
            return response()->json(['error' => true, 'message' => $e->getMessage()], 503);
        }
    }

    /**
     * Super admin guard.
     */
    protected function ensure(Request $request): void
    {
        abort_unless($request->user()?->role === 'super_admin', 403, 'Accès super admin requis');
    }
}

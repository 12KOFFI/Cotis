<?php

namespace App\Contracts\Payment;

use App\DTOs\Payment\BalanceData;
use App\DTOs\Payment\WalletData;
use App\DTOs\Payment\TransactionData;

/**
 * Contract pour les requêtes d'information marchande.
 * Implémenté par chaque adapter de provider (GeniusPay, CinetPay, etc.)
 */
interface MerchantQueryInterface
{
    /**
     * Récupère le solde global du compte marchand.
     */
    public function getBalance(): BalanceData;

    /**
     * Liste les wallets du marchand.
     *
     * @return WalletData[]
     */
    public function getWallets(): array;

    /**
     * Récupère les détails d'une transaction de paiement via sa référence.
     */
    public function getTransaction(string $reference): ?TransactionData;

    /**
     * Liste les payouts avec filtres optionnels.
     *
     * @param  array{status?: string, from?: string, to?: string, limit?: int}  $filters
     * @return array{data: array, meta: array}
     */
    public function listPayouts(array $filters = []): array;

    /**
     * Récupère les détails d'un payout spécifique via sa référence.
     */
    public function getPayoutDetails(string $reference): ?array;
}

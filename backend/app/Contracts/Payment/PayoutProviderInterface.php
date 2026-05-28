<?php

namespace App\Contracts\Payment;

use App\DTOs\Payment\PayoutRequest;
use App\DTOs\Payment\PayoutResult;

/**
 * Contract pour l'exécution de payouts (transferts sortants).
 * Chaque provider implémente sa propre logique de transfert.
 */
interface PayoutProviderInterface
{
    /**
     * Exécute un payout vers un compte mobile money.
     * Gère l'idempotency via la clé fournie dans PayoutRequest.
     *
     * @throws \RuntimeException Si le payout échoue côté provider
     */
    public function executePayout(PayoutRequest $request): PayoutResult;
}

<?php

namespace App\Contracts\Payment;

/**
 * Contract principal pour l'initiation de paiements entrants.
 * Chaque provider implémente sa propre logique de checkout.
 */
interface PaymentProviderInterface
{
    /**
     * Initie un paiement (checkout) auprès du provider.
     *
     * @param  array{
     *     amount: int,
     *     currency: string,
     *     description: string,
     *     success_url: string,
     *     cancel_url: string,
     *     metadata: array
     * }  $params
     *
     * @return array{checkout_url: ?string, reference: ?string, raw: array}
     *
     * @throws \RuntimeException Si l'initiation échoue
     */
    public function initiatePayment(array $params): array;

    /**
     * Vérifie le statut d'un paiement auprès du provider.
     *
     * @return array{status: string, data: array}
     */
    public function verifyPayment(string $reference): array;

    /**
     * Retourne le nom du provider (ex: 'geniuspay', 'cinetpay').
     */
    public function getProviderName(): string;
}

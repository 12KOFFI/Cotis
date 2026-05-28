<?php

namespace App\DTOs\Payment;

/**
 * DTO immutable — Requête de payout (transfert sortant).
 * Inclut une clé d'idempotence obligatoire (anti-double soumission).
 */
final class PayoutRequest
{
    public function __construct(
        public readonly string  $walletId,
        public readonly string  $recipientName,
        public readonly string  $recipientPhone,
        public readonly int     $amount,
        public readonly string  $idempotencyKey,
        public readonly string  $description = '',
        public readonly string  $destinationType = 'mobile_money',
        public readonly string  $destinationProvider = 'wave',
        public readonly ?string $destinationAccount = null,
    ) {}

    public function toGeniusPayPayload(): array
    {
        return [
            'wallet_id'            => $this->walletId,
            'recipient_name'       => $this->recipientName,
            'recipient_phone'      => $this->recipientPhone,
            'destination_type'     => $this->destinationType,
            'destination_provider' => $this->destinationProvider,
            'destination_account'  => $this->destinationAccount ?? $this->recipientPhone,
            'amount'               => $this->amount,
            'idempotency_key'      => $this->idempotencyKey,
            'description'          => $this->description,
        ];
    }
}

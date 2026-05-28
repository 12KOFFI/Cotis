<?php

namespace App\DTOs\Payment;

/**
 * DTO immutable — Détails d'une transaction de paiement.
 */
final class TransactionData
{
    public function __construct(
        public readonly string  $id,
        public readonly string  $reference,
        public readonly string  $status,
        public readonly int     $amount,
        public readonly int     $fees,
        public readonly int     $netAmount,
        public readonly string  $currency,
        public readonly ?string $paymentMethod,
        public readonly ?string $providerReference,
        public readonly ?string $description,
        public readonly array   $metadata,
        public readonly ?string $createdAt,
        public readonly ?string $failureReason,
    ) {}

    public static function fromGeniusPay(array $data): self
    {
        return new self(
            id:                $data['id'] ?? '',
            reference:         $data['reference'] ?? '',
            status:            $data['status'] ?? 'unknown',
            amount:            (int) ($data['amount'] ?? 0),
            fees:              (int) ($data['fees'] ?? 0),
            netAmount:         (int) ($data['net_amount'] ?? $data['amount'] ?? 0),
            currency:          $data['currency'] ?? 'XOF',
            paymentMethod:     $data['payment_method'] ?? $data['gateway'] ?? null,
            providerReference: $data['provider_reference'] ?? null,
            description:       $data['description'] ?? null,
            metadata:          $data['metadata'] ?? [],
            createdAt:         $data['created_at'] ?? null,
            failureReason:     $data['failure_reason'] ?? null,
        );
    }

    public function toArray(): array
    {
        return [
            'id'                 => $this->id,
            'reference'          => $this->reference,
            'status'             => $this->status,
            'amount'             => $this->amount,
            'fees'               => $this->fees,
            'net_amount'         => $this->netAmount,
            'currency'           => $this->currency,
            'payment_method'     => $this->paymentMethod,
            'provider_reference' => $this->providerReference,
            'description'        => $this->description,
            'metadata'           => $this->metadata,
            'created_at'         => $this->createdAt,
            'failure_reason'     => $this->failureReason,
        ];
    }
}

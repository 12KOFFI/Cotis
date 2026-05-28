<?php

namespace App\DTOs\Payment;

/**
 * DTO immutable — Solde du compte marchand.
 */
final class BalanceData
{
    public function __construct(
        public readonly int    $available,
        public readonly int    $pending,
        public readonly int    $total,
        public readonly string $currency,
    ) {}

    public static function fromGeniusPay(array $data): self
    {
        return new self(
            available: (int) ($data['available'] ?? 0),
            pending:   (int) ($data['pending'] ?? 0),
            total:     (int) ($data['total'] ?? 0),
            currency:  $data['currency'] ?? 'XOF',
        );
    }

    public function toArray(): array
    {
        return [
            'available' => $this->available,
            'pending'   => $this->pending,
            'total'     => $this->total,
            'currency'  => $this->currency,
        ];
    }
}

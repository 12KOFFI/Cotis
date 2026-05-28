<?php

namespace App\DTOs\Payment;

/**
 * DTO immutable — Wallet du marchand.
 */
final class WalletData
{
    public function __construct(
        public readonly string  $id,
        public readonly string  $name,
        public readonly string  $type,
        public readonly string  $currency,
        public readonly int     $balance,
        public readonly int     $availableBalance,
        public readonly int     $pendingBalance,
        public readonly string  $status,
        public readonly int     $dailyLimit,
        public readonly int     $dailySpent,
        public readonly int     $dailyRemaining,
        public readonly ?string $createdAt,
    ) {}

    public static function fromGeniusPay(array $data): self
    {
        return new self(
            id:              $data['id'] ?? '',
            name:            $data['name'] ?? '',
            type:            $data['type'] ?? '',
            currency:        $data['currency'] ?? 'XOF',
            balance:         (int) ($data['balance'] ?? 0),
            availableBalance:(int) ($data['available_balance'] ?? 0),
            pendingBalance:  (int) ($data['pending_balance'] ?? 0),
            status:          $data['status'] ?? 'unknown',
            dailyLimit:      (int) ($data['daily_limit'] ?? 0),
            dailySpent:      (int) ($data['daily_spent'] ?? 0),
            dailyRemaining:  (int) ($data['daily_remaining'] ?? 0),
            createdAt:       $data['created_at'] ?? null,
        );
    }

    public function toArray(): array
    {
        return [
            'id'                => $this->id,
            'name'              => $this->name,
            'type'              => $this->type,
            'currency'          => $this->currency,
            'balance'           => $this->balance,
            'available_balance' => $this->availableBalance,
            'pending_balance'   => $this->pendingBalance,
            'status'            => $this->status,
            'daily_limit'       => $this->dailyLimit,
            'daily_spent'       => $this->dailySpent,
            'daily_remaining'   => $this->dailyRemaining,
            'created_at'        => $this->createdAt,
        ];
    }
}

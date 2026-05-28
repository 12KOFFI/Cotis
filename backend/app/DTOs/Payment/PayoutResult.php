<?php

namespace App\DTOs\Payment;

/**
 * DTO immutable — Résultat d'un payout exécuté.
 */
final class PayoutResult
{
    public function __construct(
        public readonly bool    $success,
        public readonly string  $status,
        public readonly ?string $reference,
        public readonly int     $amount,
        public readonly int     $fees,
        public readonly int     $netAmount,
        public readonly ?string $providerReference,
        public readonly ?string $failureReason,
        public readonly ?string $failureCode,
        public readonly ?string $createdAt,
        public readonly array   $raw = [],
    ) {}

    public static function fromGeniusPay(array $response): self
    {
        $payout = $response['data']['payout'] ?? $response['data'] ?? [];

        $status    = $payout['status'] ?? 'unknown';
        $isSuccess = in_array($status, ['paid', 'completed', 'pending']);

        return new self(
            success:           $isSuccess,
            status:            $status,
            reference:         $payout['reference'] ?? null,
            amount:            (int) ($payout['amount'] ?? 0),
            fees:              (int) ($payout['fees'] ?? 0),
            netAmount:         (int) ($payout['net_amount'] ?? 0),
            providerReference: $payout['provider_reference'] ?? null,
            failureReason:     $payout['failure_reason'] ?? null,
            failureCode:       $payout['failure_code'] ?? null,
            createdAt:         $payout['created_at'] ?? null,
            raw:               $response,
        );
    }

    public static function failed(string $reason, string $code = 'UNKNOWN'): self
    {
        return new self(
            success:           false,
            status:            'failed',
            reference:         null,
            amount:            0,
            fees:              0,
            netAmount:         0,
            providerReference: null,
            failureReason:     $reason,
            failureCode:       $code,
            createdAt:         now()->toIso8601String(),
        );
    }

    public function toArray(): array
    {
        return [
            'success'            => $this->success,
            'status'             => $this->status,
            'reference'          => $this->reference,
            'amount'             => $this->amount,
            'fees'               => $this->fees,
            'net_amount'         => $this->netAmount,
            'provider_reference' => $this->providerReference,
            'failure_reason'     => $this->failureReason,
            'failure_code'       => $this->failureCode,
            'created_at'         => $this->createdAt,
        ];
    }
}

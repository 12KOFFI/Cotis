<?php

namespace App\DTOs\Payment;

/**
 * DTO immutable — Calcul de frais centralisé.
 * Source unique de vérité pour les règles de calcul financier.
 *
 * Règles :
 *   Frais GeniusPay       = Montant Brut × 0.015  (1.5%)
 *   Commission Plateforme = Montant Brut × 0.005  (0.5%)
 *   Net reçu              = Montant Brut - Frais GeniusPay - Commission Plateforme
 */
final class FeeCalculation
{
    public const GATEWAY_FEE_RATE   = 0.015; // 1.5%
    public const PLATFORM_FEE_RATE  = 0.005; // 0.5%

    public function __construct(
        public readonly int $grossAmount,
        public readonly int $gatewayFees,
        public readonly int $platformCommission,
        public readonly int $netAmount,
    ) {}

    /**
     * Calcule les frais à partir du montant brut demandé.
     */
    public static function fromGross(int $grossAmount): self
    {
        $gatewayFees         = (int) round($grossAmount * self::GATEWAY_FEE_RATE);
        $platformCommission  = (int) round($grossAmount * self::PLATFORM_FEE_RATE);
        $netAmount           = $grossAmount - $gatewayFees - $platformCommission;

        return new self(
            grossAmount:        $grossAmount,
            gatewayFees:        $gatewayFees,
            platformCommission: $platformCommission,
            netAmount:          max(0, $netAmount),
        );
    }

    public function toArray(): array
    {
        return [
            'gross_amount'        => $this->grossAmount,
            'gateway_fees'        => $this->gatewayFees,
            'platform_commission' => $this->platformCommission,
            'net_amount'          => $this->netAmount,
        ];
    }
}

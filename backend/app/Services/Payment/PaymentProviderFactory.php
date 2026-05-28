<?php

namespace App\Services\Payment;

use App\Contracts\Payment\MerchantQueryInterface;
use App\Contracts\Payment\PaymentProviderInterface;
use App\Contracts\Payment\PayoutProviderInterface;

/**
 * Factory pour résoudre le provider de paiement actif via config/env.
 * 
 * Le provider par défaut est GeniusPay.
 * Pour ajouter CinetPay : 
 *   1. Créer CinetPayAdapter implements les interfaces requises
 *   2. Ajouter le mapping dans $providers
 *   3. Changer PAYMENT_PROVIDER=cinetpay dans .env
 */
class PaymentProviderFactory
{
    private static array $providers = [
        'geniuspay' => GeniusPayAdapter::class,
        // 'cinetpay' => CinetPayAdapter::class,  // Futur
    ];

    /**
     * Résout un adapter qui implémente MerchantQueryInterface.
     */
    public static function merchant(): MerchantQueryInterface
    {
        return self::resolve(MerchantQueryInterface::class);
    }

    /**
     * Résout un adapter qui implémente PaymentProviderInterface.
     */
    public static function payment(): PaymentProviderInterface
    {
        return self::resolve(PaymentProviderInterface::class);
    }

    /**
     * Résout un adapter qui implémente PayoutProviderInterface.
     */
    public static function payout(): PayoutProviderInterface
    {
        return self::resolve(PayoutProviderInterface::class);
    }

    /**
     * Résolution interne : vérifie que l'adapter implémente bien l'interface demandée.
     */
    private static function resolve(string $interface): object
    {
        $providerKey = config('services.payment_provider', env('PAYMENT_PROVIDER', 'geniuspay'));

        if (!isset(self::$providers[$providerKey])) {
            throw new \RuntimeException("Payment provider [{$providerKey}] non configuré.");
        }

        $adapterClass = self::$providers[$providerKey];
        $adapter      = app($adapterClass);

        if (!$adapter instanceof $interface) {
            throw new \RuntimeException(
                "L'adapter [{$adapterClass}] n'implémente pas [{$interface}]."
            );
        }

        return $adapter;
    }
}

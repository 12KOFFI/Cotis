<?php

namespace App\Services\Payment;

use App\Contracts\Payment\MerchantQueryInterface;
use App\Contracts\Payment\PaymentProviderInterface;
use App\Contracts\Payment\PayoutProviderInterface;
use App\DTOs\Payment\BalanceData;
use App\DTOs\Payment\PayoutRequest;
use App\DTOs\Payment\PayoutResult;
use App\DTOs\Payment\TransactionData;
use App\DTOs\Payment\WalletData;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Adapter GeniusPay — implémente les 3 contracts.
 * 
 * Circuit Breaker : Si N erreurs consécutives en M minutes, le provider
 * est marqué "ouvert" et les requêtes échouent immédiatement avec un message
 * explicite au lieu de timeout côté GeniusPay.
 *
 * Retry : Les requêtes GET sont retentées 2× sur erreur réseau (pas les POST/payout).
 * Caching : Balance et wallets sont cachés 60s pour réduire la charge API.
 */
class GeniusPayAdapter implements MerchantQueryInterface, PaymentProviderInterface, PayoutProviderInterface
{
    private string $baseUrl;
    private string $apiKey;
    private string $apiSecret;
    private int    $timeout;

    // Circuit Breaker settings
    private const CB_THRESHOLD     = 5;   // N erreurs consécutives
    private const CB_DECAY_MINUTES = 3;   // Fenêtre de réinitialisation
    private const CB_CACHE_KEY     = 'geniuspay:circuit_breaker';

    // Cache TTLs
    private const CACHE_BALANCE_TTL  = 60;  // 60 secondes
    private const CACHE_WALLETS_TTL  = 60;

    public function __construct()
    {
        $config          = config('services.geniuspay');
        $this->baseUrl   = rtrim($config['base_url'] ?? 'https://pay.genius.ci/api/v1', '/');
        $this->apiKey    = $config['key'] ?? '';
        $this->apiSecret = $config['secret'] ?? '';
        $this->timeout   = (int) ($config['timeout'] ?? 15);
    }

    /* ================================================================== */
    /*  MerchantQueryInterface                                             */
    /* ================================================================== */

    public function getBalance(): BalanceData
    {
        $data = Cache::remember('geniuspay:balance', self::CACHE_BALANCE_TTL, function () {
            $response = $this->httpGet('/merchant/account/balance');
            return $response['data'] ?? [];
        });

        return BalanceData::fromGeniusPay($data);
    }

    public function getWallets(): array
    {
        $walletsRaw = Cache::remember('geniuspay:wallets', self::CACHE_WALLETS_TTL, function () {
            $response = $this->httpGet('/merchant/wallets');
            return $response['data']['wallets'] ?? [];
        });

        return array_map(fn(array $w) => WalletData::fromGeniusPay($w), $walletsRaw);
    }

    public function getTransaction(string $reference): ?TransactionData
    {
        try {
            $response = $this->httpGet("/merchant/payments/{$reference}");
            $data = $response['data'] ?? $response;
            return TransactionData::fromGeniusPay($data);
        } catch (\Exception $e) {
            Log::warning('GeniusPay: transaction not found', ['reference' => $reference, 'error' => $e->getMessage()]);
            return null;
        }
    }

    public function listPayouts(array $filters = []): array
    {
        $query = http_build_query(array_filter([
            'status' => $filters['status'] ?? null,
            'from'   => $filters['from'] ?? null,
            'to'     => $filters['to'] ?? null,
            'limit'  => $filters['limit'] ?? 20,
        ]));

        $response = $this->httpGet('/merchant/payouts' . ($query ? "?{$query}" : ''));

        return [
            'data' => $response['data'] ?? [],
            'meta' => $response['meta'] ?? [],
        ];
    }

    public function getPayoutDetails(string $reference): ?array
    {
        try {
            $response = $this->httpGet("/merchant/payouts/{$reference}");
            return $response['data'] ?? null;
        } catch (\Exception $e) {
            Log::warning('GeniusPay: payout details not found', ['reference' => $reference]);
            return null;
        }
    }

    /* ================================================================== */
    /*  PaymentProviderInterface                                            */
    /* ================================================================== */

    public function initiatePayment(array $params): array
    {
        $response = $this->httpPost('/merchant/payments', [
            'amount'      => $params['amount'],
            'currency'    => $params['currency'] ?? 'XOF',
            'description' => $params['description'] ?? '',
            'success_url' => $params['success_url'],
            'cancel_url'  => $params['cancel_url'],
            'metadata'    => $params['metadata'] ?? [],
        ]);

        return [
            'checkout_url' => $response['data']['checkout_url'] ?? $response['checkout_url'] ?? null,
            'reference'    => $response['data']['reference'] ?? $response['reference'] ?? null,
            'raw'          => $response,
        ];
    }

    public function verifyPayment(string $reference): array
    {
        $response = $this->httpGet("/merchant/payments/{$reference}");

        return [
            'status' => $response['data']['status'] ?? $response['status'] ?? 'unknown',
            'data'   => $response['data'] ?? [],
        ];
    }

    public function getProviderName(): string
    {
        return 'geniuspay';
    }

    /* ================================================================== */
    /*  PayoutProviderInterface                                             */
    /* ================================================================== */

    public function executePayout(PayoutRequest $request): PayoutResult
    {
        try {
            $response = $this->httpPost('/merchant/payouts', $request->toGeniusPayPayload());

            // Invalider le cache balance après un payout
            Cache::forget('geniuspay:balance');
            Cache::forget('geniuspay:wallets');

            return PayoutResult::fromGeniusPay($response);
        } catch (\Exception $e) {
            Log::error('GeniusPay payout failed', [
                'idempotency_key' => $request->idempotencyKey,
                'amount'          => $request->amount,
                'error'           => $e->getMessage(),
            ]);

            return PayoutResult::failed($e->getMessage(), 'PROVIDER_ERROR');
        }
    }

    /* ================================================================== */
    /*  HTTP Client (Circuit Breaker + Retry)                               */
    /* ================================================================== */

    private function httpGet(string $endpoint): array
    {
        $this->checkCircuitBreaker();

        try {
            $response = Http::withHeaders($this->headers())
                ->timeout($this->timeout)
                ->retry(2, 500, fn($e) => $e instanceof \Illuminate\Http\Client\ConnectionException)
                ->get($this->baseUrl . $endpoint);

            if ($response->failed()) {
                $this->recordFailure();
                throw new \RuntimeException("GeniusPay GET {$endpoint} failed: HTTP {$response->status()} — " . $response->body());
            }

            $this->resetCircuitBreaker();
            return $response->json();
        } catch (\Illuminate\Http\Client\ConnectionException $e) {
            $this->recordFailure();
            throw new \RuntimeException("GeniusPay GET {$endpoint} connexion impossible: " . $e->getMessage());
        }
    }

    private function httpPost(string $endpoint, array $payload): array
    {
        $this->checkCircuitBreaker();

        try {
            $response = Http::withHeaders($this->headers())
                ->timeout($this->timeout)
                ->post($this->baseUrl . $endpoint, $payload);

            if ($response->failed()) {
                $this->recordFailure();

                $body  = $response->json();
                $error = $body['error'] ?? $body['message'] ?? $response->body();
                $code  = $body['error_code'] ?? $body['code'] ?? 'HTTP_' . $response->status();

                throw new \RuntimeException("GeniusPay POST {$endpoint}: [{$code}] {$error}");
            }

            $this->resetCircuitBreaker();
            return $response->json();
        } catch (\Illuminate\Http\Client\ConnectionException $e) {
            $this->recordFailure();
            throw new \RuntimeException("GeniusPay POST {$endpoint} connexion impossible: " . $e->getMessage());
        }
    }

    private function headers(): array
    {
        return [
            'X-API-Key'    => $this->apiKey,
            'X-API-Secret' => $this->apiSecret,
            'Accept'       => 'application/json',
            'Content-Type' => 'application/json',
        ];
    }

    /* ================================================================== */
    /*  Circuit Breaker                                                     */
    /* ================================================================== */

    private function checkCircuitBreaker(): void
    {
        $failures = (int) Cache::get(self::CB_CACHE_KEY, 0);

        if ($failures >= self::CB_THRESHOLD) {
            Log::critical('GeniusPay Circuit Breaker OUVERT — trop d\'erreurs consécutives', [
                'failures' => $failures,
            ]);

            throw new \RuntimeException(
                'Service GeniusPay temporairement indisponible. Réessayez dans quelques minutes.'
            );
        }
    }

    private function recordFailure(): void
    {
        $current = (int) Cache::get(self::CB_CACHE_KEY, 0);
        Cache::put(self::CB_CACHE_KEY, $current + 1, now()->addMinutes(self::CB_DECAY_MINUTES));

        Log::warning('GeniusPay: erreur enregistrée dans le circuit breaker', [
            'total_failures' => $current + 1,
            'threshold'      => self::CB_THRESHOLD,
        ]);
    }

    private function resetCircuitBreaker(): void
    {
        if (Cache::has(self::CB_CACHE_KEY)) {
            Cache::forget(self::CB_CACHE_KEY);
        }
    }
}

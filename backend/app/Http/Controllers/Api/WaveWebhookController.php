<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Paiement;
use App\Models\Groupe;
use App\Models\Membre;
use App\Models\Caisse;
use App\Models\CaisseLedger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class WaveWebhookController extends Controller
{
    public function handle(Request $request)
    {
        // 1) Signature HMAC
        $secret = env('WAVE_WEBHOOK_SECRET', '');
        $signature = $request->header('Wave-Signature') ?? '';
        $payload = $request->getContent();
        if ($secret) {
            $expected = hash_hmac('sha256', $payload, $secret);
            if (!hash_equals($expected, $signature)) {
                Log::warning('Wave webhook: signature invalide');
                return response()->json(['ok' => false], 400);
            }
        }

        $data = $request->json()->all();
        $txId = $data['transaction_id'] ?? null;
        if (!$txId) return response()->json(['ok' => false], 422);

        // 2) Idempotence
        if (Paiement::where('transaction_id', $txId)->exists()) {
            return response()->json(['ok' => true, 'idempotent' => true]);
        }

        $groupeId = (int) ($data['groupe_id'] ?? 0);
        $membreId = (int) ($data['membre_id'] ?? 0);
        $montant = (int) ($data['montant'] ?? 0);
        $type = $data['type'] ?? 'cotisation';

        $groupe = Groupe::find($groupeId);
        $membre = Membre::find($membreId);
        if (!$groupe || !$membre || $montant <= 0) {
            return response()->json(['ok' => false], 422);
        }

        $paiement = Paiement::create([
            'groupe_id' => $groupe->id,
            'membre_id' => $membre->id,
            'type' => $type,
            'montant' => $montant,
            'mode' => 'wave',
            'statut' => 'reussi',
            'date_paiement' => now()->toDateString(),
            'transaction_id' => $txId,
        ]);
        $caisse = $groupe->caisse ?? Caisse::create(['groupe_id' => $groupe->id, 'solde' => 0]);
        CaisseLedger::create([
            'caisse_id' => $caisse->id,
            'groupe_id' => $groupe->id,
            'type' => 'entree',
            'montant' => $montant,
            'motif' => 'Paiement Wave #' . $txId,
            'date' => now()->toDateString(),
            'paiement_id' => $paiement->id,
        ]);
        $caisse->solde += $montant;
        $caisse->save();
        return response()->json(['ok' => true]);
    }
}

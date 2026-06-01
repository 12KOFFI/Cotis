<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Groupe;
use App\Models\Membre;
use App\Models\Paiement;
use App\Models\PaiementLog;
use App\Models\Periode;
use App\Models\AdhesionFrais;
use App\Models\Caisse;
use App\Models\CaisseLedger;
use App\Models\CreditMembre;
use App\Traits\AuthorizesGroupe;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PaiementController extends Controller
{
    use AuthorizesGroupe;

    public function index(Request $request, Groupe $groupe)
    {
        $this->authorizeGroupe($request, $groupe, true);
        $paiements = $groupe->paiements()->with('membre', 'periode')->latest('created_at')->limit(200)->get();
        return response()->json(['paiements' => $paiements]);
    }

    public function mesPaiements(Request $request, Groupe $groupe)
    {
        $currentUser = $request->user();
        $membre = $groupe->membres()->where('user_id', $currentUser->id)->first();
        abort_unless($membre, 403);
        $paiements = Paiement::where('membre_id', $membre->id)->with('periode')->latest('created_at')->get();
        return response()->json(['paiements' => $paiements, 'membre' => $membre->load('adhesion', 'credits')]);
    }

    public function preuveImage(Request $request, Groupe $groupe, Paiement $paiement)
    {
        $this->authorizeGroupe($request, $groupe, true);
        abort_unless($paiement->groupe_id === $groupe->id, 404);
        abort_unless($paiement->preuve_path, 404, 'Aucune preuve jointe.');

        $path = storage_path('app/public/' . $paiement->preuve_path);
        abort_unless(file_exists($path), 404, 'Fichier introuvable.');

        $mime = mime_content_type($path);
        return response()->file($path, [
            'Content-Type' => $mime,
            'Cache-Control' => 'public, max-age=86400',
        ]);
    }

    /* ------------------------------------------------------------------ */
    /*  Initiation du paiement GeniusPay                                  */
    /* ------------------------------------------------------------------ */

    public function initierPaiement(Request $request, Groupe $groupe)
    {
        $data = $request->validate([
            'type'           => 'required|in:cotisation,adhesion',
            'montant'        => 'nullable|integer|min:1',
            'montant_envoye' => 'nullable|integer|min:1',
            'membre_id'      => 'nullable|exists:membres,id',
        ]);

        $currentUser = $request->user();
        
        if (!empty($data['membre_id'])) {
            abort_unless($groupe->gestionnaire_id === $currentUser->id || $currentUser->role === 'super_admin', 403, "Seul le gestionnaire peut initier un paiement pour un autre membre.");
            $membre = $groupe->membres()->findOrFail($data['membre_id']);
        } else {
            $membre = $groupe->membres()->where('user_id', $currentUser->id)->first();
            abort_unless($membre, 403, "Vous n'êtes pas membre de ce groupe.");
        }

        if ($data['type'] === 'cotisation' && $groupe->adhesion_active) {
            $adhesionFrais = $membre->adhesion;
            abort_if($adhesionFrais && $adhesionFrais->statut !== 'paye', 422, "Droit d'adhésion non réglé. Veuillez d'abord régler l'adhésion.");
        }

        $groupe->ensurePeriodsUpToDate();
        $montant = (int) ($data['montant'] ?? 0);
        if ($montant <= 0) {
            $montant = $data['type'] === 'adhesion'
                ? max(0, (int) (($membre->adhesion?->montant_du ?? $groupe->adhesion_montant) - ($membre->adhesion?->montant_paye ?? 0)))
                : $this->resteCotisation($groupe, $membre);
        }
        
        $montantEnvoye = (int) ceil(($montant * 1.01 + 100) / 0.975);
        $frais = $montantEnvoye - $montant;

        abort_if($montant <= 0, 422, 'Aucun montant à payer.');

        Log::info('GeniusPay: Initiation paiement', [
            'montant_net'    => $montant,
            'frais'          => $frais,
            'montant_envoye' => $montantEnvoye,
            'membre_id'      => $membre->id,
            'groupe_id'      => $groupe->id,
            'type'           => $data['type'],
        ]);

        $apiKey    = config('services.geniuspay.key');
        $apiSecret = config('services.geniuspay.secret');
        $baseUrl   = config('services.geniuspay.base_url');
        abort_unless($apiKey && $apiSecret, 500, 'Configuration Genius Pay manquante.');

        $frontendUrl = rtrim(config('app.frontend_url'), '/');

        $response = Http::when(app()->environment('local'), function ($client) {
                return $client->withoutVerifying();
            })
            ->timeout(15)
            ->withHeaders([
                'X-API-Key'    => $apiKey,
                'X-API-Secret' => $apiSecret,
                'Accept'       => 'application/json',
                'Content-Type' => 'application/json',
                'User-Agent'   => 'CotisPro-Backend/1.0',
            ])
            ->post("{$baseUrl}/merchant/payments", [
                'amount'         => $montantEnvoye, // Montant total facturé au client
                'currency'       => 'XOF',
                'payment_method' => 'wave',
                'gateway'        => 'wave',
                'description'    => 'Paiement ' . $data['type'] . ' - ' . $membre->nom,
                'success_url'    => $frontendUrl . '/paiement/succes',
                'cancel_url'     => $frontendUrl . '/paiement/erreur',
                'metadata'       => [
                    'groupe_id' => $groupe->id,
                    'membre_id' => $membre->id,
                    'type'      => $data['type'],
                    'montant'   => $montant, // Montant qui sera crédité à la caisse (Le bénéficiaire reçoit)
                    'frais'     => $frais, // Commission de la plateforme
                ],
            ]);

        if (!$response->successful()) {
            Log::error('GeniusPay: échec initiation paiement', [
                'status' => $response->status(),
                'body'   => $response->body(),
            ]);
            abort(502, 'Le service de paiement est temporairement indisponible.');
        }

        $payload = $response->json();
        $paymentData = $payload['data'] ?? [];
        $transactionId = $paymentData['id'] ?? $paymentData['reference'] ?? $payload['id'] ?? null;

        Log::info('GeniusPay: Réponse API', [
            'transaction_id' => $transactionId,
            'checkout_url'   => $paymentData['checkout_url'] ?? $paymentData['payment_url'] ?? $payload['checkout_url'] ?? null,
            'full_response'  => $payload,
        ]);

        if ($transactionId) {
            $paiement = new Paiement([
                'groupe_id'      => $groupe->id,
                'membre_id'      => $membre->id,
                'periode_id'     => null,
                'type'           => $data['type'],
                'montant'        => $montant,
                'mode'           => 'wave',
                'statut'         => 'en_attente',
                'date_paiement'  => now()->toDateString(),
                'transaction_id' => $transactionId,
                'note'           => 'Paiement en ligne initié via GeniusPay',
                'enregistre_par' => $currentUser->id,
            ]);

            $fraisGeniusPay        = (int) round($montantEnvoye * 0.025 + 100);
            $commissionPlateforme  = $montantEnvoye - $fraisGeniusPay - $montant;

            $paiement->montant_membre         = $montant;
            $paiement->frais_gateway          = $fraisGeniusPay;
            $paiement->commission_plateforme  = $commissionPlateforme;
            $paiement->save();
        }

        return response()->json([
            'checkout_url' => $paymentData['checkout_url'] ?? $paymentData['payment_url'] ?? $payload['checkout_url'] ?? null,
            'reference'    => $transactionId,
        ]);
    }

    /* ------------------------------------------------------------------ */
    /*  Vérification manuelle d'un paiement en attente (gestionnaire)      */
    /* ------------------------------------------------------------------ */

    public function verifierPaiement(Request $request, Groupe $groupe, Paiement $paiement)
    {
        $this->authorizeGroupe($request, $groupe);
        abort_unless($paiement->groupe_id === $groupe->id, 404);
        abort_unless($paiement->statut === 'en_attente', 422, 'Ce paiement n\'est pas en attente.');
        abort_unless($paiement->transaction_id, 422, 'Pas de référence de transaction.');

        $apiKey    = config('services.geniuspay.key');
        $apiSecret = config('services.geniuspay.secret');
        $baseUrl   = config('services.geniuspay.base_url');

        $response = Http::withHeaders([
            'X-API-Key'    => $apiKey,
            'X-API-Secret' => $apiSecret,
            'Accept'       => 'application/json',
            'User-Agent'   => 'CotisPro-Backend/1.0',
        ])->get("{$baseUrl}/merchant/payments/{$paiement->transaction_id}");

        if (!$response->successful()) {
            Log::warning('GeniusPay: vérification échouée', ['body' => $response->body()]);
            return response()->json(['message' => 'Impossible de vérifier le paiement auprès de GeniusPay.'], 502);
        }

        $payload = $response->json();
        $status  = $payload['data']['status'] ?? $payload['status'] ?? 'unknown';

        Log::info('GeniusPay: Vérification manuelle', [
            'transaction_id' => $paiement->transaction_id,
            'status_distant' => $status,
            'full_response'  => $payload,
        ]);

        if (in_array($status, ['completed', 'success', 'paid'])) {
            // Paiement confirmé → traiter comme un webhook success
            $metadata = $payload['data']['metadata'] ?? [];
            $montant  = (int) ($metadata['montant'] ?? $paiement->montant);

            $result = $this->enregistrerPaiementConfirme($groupe, $paiement->membre, $paiement->type, $montant, $paiement->transaction_id);

            return response()->json(['message' => 'Paiement confirmé avec succès.', 'status' => 'reussi', 'result' => $result]);
        }

        if (in_array($status, ['failed', 'expired', 'cancelled'])) {
            $paiement->update(['statut' => $status === 'cancelled' ? 'annule' : 'echoue']);
            return response()->json(['message' => 'Le paiement a échoué ou a été annulé.', 'status' => $paiement->statut]);
        }

        return response()->json(['message' => 'Le paiement est toujours en cours de traitement.', 'status' => $status]);
    }

    /* ------------------------------------------------------------------ */
    /*  Enregistrement manuel (gestionnaire / trésorier)                   */
    /* ------------------------------------------------------------------ */

    public function store(Request $request, Groupe $groupe)
    {
        $this->authorizeGroupe($request, $groupe);
        $data = $request->validate([
            'membre_id'      => 'required|exists:membres,id',
            'type'           => 'required|in:cotisation,adhesion,autre',
            'montant'        => 'required|integer|min:1',
            'mode'           => 'required|in:cash,wave,virement,autre',
            'date_paiement'  => 'required|date',
            'note'           => 'nullable|string',
            'justificatif'   => 'nullable|file|mimes:jpeg,png,webp,pdf|max:5120',
        ]);

        if ($request->hasFile('justificatif')) {
            $data['preuve_path'] = $request->file('justificatif')->store('preuves', 'public');
        }

        $membre = Membre::findOrFail($data['membre_id']);
        abort_unless($membre->groupe_id === $groupe->id, 422);
        $groupe->ensurePeriodsUpToDate();

        return DB::transaction(function () use ($groupe, $membre, $data, $request) {
            // Blocage : non-adhérent ne peut pas payer de cotisations si adhésion non payée
            if ($data['type'] === 'cotisation' && $groupe->adhesion_active) {
                $adhesionFrais = $membre->adhesion;
                abort_if($adhesionFrais && $adhesionFrais->statut !== 'paye', 422, "Droit d'adhésion non réglé. Veuillez d'abord régler l'adhésion.");
            }

            $paiements = $this->imputerPaiement(
                $groupe,
                $membre,
                $data,
                $data['montant'],
                $request->user()->id
            );

            return response()->json(['paiements' => $paiements], 201);
        });
    }

    /* ------------------------------------------------------------------ */
    /*  Confirmation automatique via webhook                               */
    /* ------------------------------------------------------------------ */

    public function enregistrerPaiementConfirme(Groupe $groupe, Membre $membre, string $type, int $montant, string $transactionId): array
    {
        $groupe->ensurePeriodsUpToDate();

        return DB::transaction(function () use ($groupe, $membre, $type, $montant, $transactionId) {
            if (Paiement::where('transaction_id', $transactionId)->where('statut', 'reussi')->exists()) {
                return ['idempotent' => true];
            }

            // Supprimer la transaction temporaire en attente pour la recréer en statut réussi
            Paiement::where('transaction_id', $transactionId)->where('statut', 'en_attente')->delete();

            $data = [
                'type'           => $type,
                'mode'           => 'wave',
                'date_paiement'  => now()->toDateString(),
                'note'           => 'Paiement Genius Pay confirmé automatiquement',
            ];

            $paiements = $this->imputerPaiement($groupe, $membre, $data, $montant, null, $transactionId);

            return ['paiements' => $paiements];
        });
    }

    /* ------------------------------------------------------------------ */
    /*  Modification d'un paiement existant                                */
    /* ------------------------------------------------------------------ */

    public function update(Request $request, Groupe $groupe, Paiement $paiement)
    {
        $this->authorizeGroupe($request, $groupe);
        abort_unless($paiement->groupe_id === $groupe->id, 404);

        $data = $request->validate([
            'montant'        => 'sometimes|integer|min:0',
            'mode'           => 'sometimes|in:cash,wave,virement,autre',
            'note'           => 'nullable|string',
            'date_paiement'  => 'sometimes|date',
        ]);

        $avant = $paiement->toArray();
        $delta = isset($data['montant']) ? $data['montant'] - $paiement->montant : 0;
        $paiement->update(array_merge($data, ['modifie' => true]));

        PaiementLog::create([
            'paiement_id' => $paiement->id,
            'auteur_id'   => $request->user()->id,
            'avant'       => $avant,
            'apres'       => $paiement->toArray(),
            'action'      => 'update',
        ]);

        if ($delta !== 0) {
            $caisse = $groupe->caisse;
            if ($caisse) {
                CaisseLedger::create([
                    'caisse_id'   => $caisse->id,
                    'groupe_id'   => $groupe->id,
                    'type'        => $delta > 0 ? 'entree' : 'sortie',
                    'montant'     => abs($delta),
                    'motif'       => 'Ajustement paiement #' . $paiement->id,
                    'date'        => now()->toDateString(),
                    'paiement_id' => $paiement->id,
                    'auteur_id'   => $request->user()->id,
                ]);
            }
        }

        return response()->json(['paiement' => $paiement]);
    }

    /* ================================================================== */
    /*  MÉTHODES PRIVÉES                                                   */
    /* ================================================================== */

    /**
     * Logique d'imputation unique — utilisée par store() ET enregistrerPaiementConfirme().
     * Gère : adhésion, cotisation (ancienneté), excédent en crédit, activation du membre.
     *
     * @return Paiement[]
     */
    private function imputerPaiement(
        Groupe $groupe,
        Membre $membre,
        array $data,
        int $montant,
        ?int $userId,
        ?string $transactionId = null
    ): array {
        $paiements = [];
        $reste = $montant;

        if ($data['type'] === 'adhesion') {
            $adhesionFrais = AdhesionFrais::firstOrCreate(
                ['groupe_id' => $groupe->id, 'membre_id' => $membre->id],
                ['montant_du' => $groupe->adhesion_montant]
            );
            $adhesionFrais->montant_paye += $reste;
            if ($adhesionFrais->montant_paye >= $adhesionFrais->montant_du) {
                $adhesionFrais->statut = 'paye';
                $adhesionFrais->paye_at = now();
                if ($membre->statut === 'actif_non_verifie') {
                    $membre->statut = 'actif';
                    $membre->save();
                }
            }
            $adhesionFrais->save();

            $paiement = $this->createPaiement($groupe, $membre, null, $data, $reste, $userId);
            if ($transactionId) {
                $paiement->transaction_id = $transactionId;
                $paiement->save();
            }
            $paiements[] = $paiement;

        } else {
            // Cotisation : imputation par ancienneté sur périodes impayées
            $periodes = $groupe->periodes()->orderBy('date_debut')->get();
            foreach ($periodes as $periode) {
                if ($reste <= 0) break;
                $montantDu = $membre->montant_perso ?? $groupe->montant_standard;
                $montantDejaVerse = (int) Paiement::cotisationReussie($membre->id, $periode->id)->sum('montant');
                $manquant = max(0, $montantDu - $montantDejaVerse);
                if ($manquant <= 0) continue;

                $aImputer = min($manquant, $reste);
                $paiement = $this->createPaiement($groupe, $membre, $periode, $data, $aImputer, $userId);
                if ($transactionId && empty($paiements)) {
                    $paiement->transaction_id = $transactionId;
                    $paiement->save();
                }
                $paiements[] = $paiement;
                $reste -= $aImputer;
            }

            // Excédent -> crédit reporté
            if ($reste > 0) {
                CreditMembre::create([
                    'groupe_id'         => $groupe->id,
                    'membre_id'         => $membre->id,
                    'montant'           => $reste,
                    'periode_source_id' => optional($periodes->last())->id,
                ]);
                $paiement = $this->createPaiement($groupe, $membre, null, array_merge($data, ['type' => 'autre']), $reste, $userId);
                if ($transactionId && empty($paiements)) {
                    $paiement->transaction_id = $transactionId;
                    $paiement->save();
                }
                $paiements[] = $paiement;
            }

            if ($membre->statut === 'actif_non_verifie') {
                $membre->statut = 'actif';
                $membre->save();
            }
        }

        return $paiements;
    }

    /**
     * Crée un paiement + son écriture dans le ledger de caisse.
     */
    protected function createPaiement(Groupe $groupe, Membre $membre, ?Periode $periode, array $data, int $montant, ?int $userId): Paiement
    {
        $paiement = Paiement::create([
            'groupe_id'      => $groupe->id,
            'membre_id'      => $membre->id,
            'periode_id'     => $periode?->id,
            'type'           => $data['type'],
            'montant'        => $montant,
            'mode'           => $data['mode'],
            'statut'         => 'reussi',
            'date_paiement'  => $data['date_paiement'],
            'note'           => $data['note'] ?? null,
            'preuve_path'    => $data['preuve_path'] ?? null,
            'enregistre_par' => $userId,
        ]);

        // Ledger entry
        $caisse = $groupe->caisse ?? Caisse::create(['groupe_id' => $groupe->id, 'solde' => 0]);
        CaisseLedger::create([
            'caisse_id'   => $caisse->id,
            'groupe_id'   => $groupe->id,
            'type'        => 'entree',
            'montant'     => $montant,
            'motif'       => ucfirst($data['type']) . ' - ' . ($membre->full_name),
            'date'        => $data['date_paiement'],
            'paiement_id' => $paiement->id,
            'auteur_id'   => $userId,
        ]);

        return $paiement;
    }

    /**
     * Calcule le montant total restant dû sur toutes les périodes.
     */
    protected function resteCotisation(Groupe $groupe, Membre $membre): int
    {
        $montantDu = $membre->montant_perso ?? $groupe->montant_standard;
        $reste = 0;
        foreach ($groupe->periodes()->orderBy('date_debut')->get() as $periode) {
            $montantDejaVerse = (int) Paiement::cotisationReussie($membre->id, $periode->id)->sum('montant');
            $reste += max(0, $montantDu - $montantDejaVerse);
        }
        return $reste;
    }
}

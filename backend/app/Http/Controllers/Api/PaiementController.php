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
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PaiementController extends Controller
{
    public function index(Request $request, Groupe $groupe)
    {
        $this->authorizeGroupe($request, $groupe, true);
        $paiements = $groupe->paiements()->with('membre', 'periode')->latest('date_paiement')->limit(200)->get();
        return response()->json(['paiements' => $paiements]);
    }

    public function mesPaiements(Request $request, Groupe $groupe)
    {
        $u = $request->user();
        $membre = $groupe->membres()->where('user_id', $u->id)->first();
        abort_unless($membre, 403);
        $paiements = Paiement::where('membre_id', $membre->id)->with('periode')->latest('date_paiement')->get();
        return response()->json(['paiements' => $paiements, 'membre' => $membre->load('adhesion', 'credits')]);
    }

    public function demandes(Request $request, Groupe $groupe)
    {
        $this->authorizeGroupe($request, $groupe);
        $demandes = $groupe->paiements()
            ->where('statut', 'en_attente')
            ->where('enregistre_par', null)
            ->with('membre')
            ->latest('created_at')
            ->get();
        return response()->json(['demandes' => $demandes]);
    }

    public function storeDemande(Request $request, Groupe $groupe)
    {
        $u = $request->user();
        $membre = $groupe->membres()->where('user_id', $u->id)->first();
        abort_unless($membre, 403, "Vous n'êtes pas membre de ce groupe.");

        $data = $request->validate([
            'montant' => 'required|integer|min:1',
            'mode' => 'required|in:orange_money,wave,moov,mtn',
            'preuve' => 'required|image|mimes:jpeg,png,webp|max:5120',
        ]);

        $path = $request->file('preuve')->store('preuves', 'public');

        $paiement = Paiement::create([
            'groupe_id' => $groupe->id,
            'membre_id' => $membre->id,
            'type' => 'cotisation',
            'montant' => $data['montant'],
            'mode' => $data['mode'],
            'statut' => 'en_attente',
            'date_paiement' => now()->toDateString(),
            'preuve_path' => $path,
            'note' => 'Soumis par le membre',
        ]);

        return response()->json(['paiement' => $paiement], 201);
    }

    public function validerDemande(Request $request, Groupe $groupe, Paiement $paiement)
    {
        $this->authorizeGroupe($request, $groupe);
        abort_unless($paiement->groupe_id === $groupe->id, 404);
        abort_unless($paiement->statut === 'en_attente', 422, 'Cette demande a déjà été traitée.');

        $groupe->ensurePeriodsUpToDate();

        return DB::transaction(function () use ($groupe, $paiement, $request) {
            $paiement->update([
                'statut' => 'reussi',
                'valide_par' => $request->user()->id,
                'valide_at' => now(),
                'enregistre_par' => $request->user()->id,
            ]);

            $membre = $paiement->membre;

            // Imputation sur période
            $reste = $paiement->montant;
            if ($paiement->type === 'cotisation') {
                $periodes = $groupe->periodes()->orderBy('date_debut')->get();
                foreach ($periodes as $p) {
                    if ($reste <= 0) break;
                    $du = $membre->montant_perso ?? $groupe->montant_standard;
                    $deja = Paiement::where('membre_id', $membre->id)
                        ->where('periode_id', $p->id)
                        ->where('type', 'cotisation')
                        ->where('statut', 'reussi')
                        ->where('id', '!=', $paiement->id)
                        ->sum('montant');
                    $manquant = max(0, $du - $deja);
                    if ($manquant <= 0) continue;
                    $apply = min($manquant, $reste);
                    $paiement->periode_id = $p->id;
                    $reste -= $apply;
                }
                if ($reste > 0) {
                    CreditMembre::create([
                        'groupe_id' => $groupe->id,
                        'membre_id' => $membre->id,
                        'montant' => $reste,
                        'periode_source_id' => optional($periodes->last())->id,
                    ]);
                }
                if ($membre->statut === 'actif_non_verifie') {
                    $membre->statut = 'actif';
                    $membre->save();
                }
            }

            // Adhesion
            if ($paiement->type === 'adhesion' && $groupe->adhesion_active) {
                $ad = AdhesionFrais::firstOrCreate(
                    ['groupe_id' => $groupe->id, 'membre_id' => $membre->id],
                    ['montant_du' => $groupe->adhesion_montant]
                );
                $ad->montant_paye += $paiement->montant;
                if ($ad->montant_paye >= $ad->montant_du) {
                    $ad->statut = 'paye';
                    $ad->paye_at = now();
                }
                $ad->save();
            }

            $paiement->save();

            // Caisse + ledger
            $caisse = $groupe->caisse ?? Caisse::create(['groupe_id' => $groupe->id, 'solde' => 0]);
            CaisseLedger::create([
                'caisse_id' => $caisse->id,
                'groupe_id' => $groupe->id,
                'type' => 'entree',
                'montant' => $paiement->montant,
                'motif' => 'Validation paiement - ' . ($membre->full_name),
                'date' => now()->toDateString(),
                'paiement_id' => $paiement->id,
                'auteur_id' => $request->user()->id,
            ]);
            $caisse->solde += $paiement->montant;
            $caisse->save();

            PaiementLog::create([
                'paiement_id' => $paiement->id,
                'auteur_id' => $request->user()->id,
                'avant' => ['statut' => 'en_attente'],
                'apres' => $paiement->toArray(),
                'action' => 'validation',
            ]);

            return response()->json(['paiement' => $paiement->load('membre')]);
        });
    }

    public function refuserDemande(Request $request, Groupe $groupe, Paiement $paiement)
    {
        $this->authorizeGroupe($request, $groupe);
        abort_unless($paiement->groupe_id === $groupe->id, 404);
        abort_unless($paiement->statut === 'en_attente', 422, 'Cette demande a déjà été traitée.');

        $data = $request->validate(['motif_refus' => 'nullable|string|max:500']);

        $paiement->update([
            'statut' => 'echoue',
            'valide_par' => $request->user()->id,
            'valide_at' => now(),
            'note' => $data['motif_refus'] ? 'Refusé : ' . $data['motif_refus'] : 'Refusé par le gestionnaire',
        ]);

        PaiementLog::create([
            'paiement_id' => $paiement->id,
            'auteur_id' => $request->user()->id,
            'avant' => ['statut' => 'en_attente'],
            'apres' => $paiement->toArray(),
            'action' => 'refus',
        ]);

        return response()->json(['paiement' => $paiement]);
    }

    public function store(Request $request, Groupe $groupe)
    {
        $this->authorizeGroupe($request, $groupe);
        $data = $request->validate([
            'membre_id' => 'required|exists:membres,id',
            'type' => 'required|in:cotisation,adhesion,autre',
            'montant' => 'required|integer|min:1',
            'mode' => 'required|in:cash,wave,virement,autre',
            'date_paiement' => 'required|date',
            'note' => 'nullable|string',
        ]);
        $membre = Membre::findOrFail($data['membre_id']);
        abort_unless($membre->groupe_id === $groupe->id, 422);
        $groupe->ensurePeriodsUpToDate();

        return DB::transaction(function () use ($groupe, $membre, $data, $request) {
            // Blocage : non-adhérent ne peut pas payer de cotisations si adhésion non payée
            if ($data['type'] === 'cotisation' && $groupe->adhesion_active) {
                $ad = $membre->adhesion;
                abort_if($ad && $ad->statut !== 'paye', 422, "Droit d'adhésion non réglé. Veuillez d'abord régler l'adhésion.");
            }

            $paiements = [];
            $reste = $data['montant'];

            if ($data['type'] === 'adhesion') {
                $ad = AdhesionFrais::firstOrCreate(
                    ['groupe_id' => $groupe->id, 'membre_id' => $membre->id],
                    ['montant_du' => $groupe->adhesion_montant]
                );
                $ad->montant_paye += $reste;
                if ($ad->montant_paye >= $ad->montant_du) {
                    $ad->statut = 'paye';
                    $ad->paye_at = now();
                    if ($membre->statut === 'actif_non_verifie') {
                        $membre->statut = 'actif';
                        $membre->save();
                    }
                }
                $ad->save();
                $paiements[] = $this->createPaiement($groupe, $membre, null, $data, $reste, $request->user()->id);
                $reste = 0;
            } else {
                // Cotisation : imputation par ancienneté sur périodes impayées
                $periodes = $groupe->periodes()->orderBy('date_debut')->get();
                foreach ($periodes as $p) {
                    if ($reste <= 0) break;
                    $du = $membre->montant_perso ?? $groupe->montant_standard;
                    $deja = Paiement::where('membre_id', $membre->id)
                        ->where('periode_id', $p->id)
                        ->where('type', 'cotisation')
                        ->where('statut', 'reussi')->sum('montant');
                    $manquant = max(0, $du - $deja);
                    if ($manquant <= 0) continue;
                    $apply = min($manquant, $reste);
                    $paiements[] = $this->createPaiement($groupe, $membre, $p, $data, $apply, $request->user()->id);
                    $reste -= $apply;
                }
                // Excédent -> crédit reporté
                if ($reste > 0) {
                    CreditMembre::create([
                        'groupe_id' => $groupe->id,
                        'membre_id' => $membre->id,
                        'montant' => $reste,
                        'periode_source_id' => optional($periodes->last())->id,
                    ]);
                    // On enregistre quand même en autre
                    $paiements[] = $this->createPaiement($groupe, $membre, null, array_merge($data, ['type' => 'autre']), $reste, $request->user()->id);
                    $reste = 0;
                }
                if ($membre->statut === 'actif_non_verifie') {
                    $membre->statut = 'actif';
                    $membre->save();
                }
            }

            return response()->json(['paiements' => $paiements], 201);
        });
    }

    protected function createPaiement(Groupe $groupe, Membre $membre, ?Periode $periode, array $data, int $montant, int $userId): Paiement
    {
        $p = Paiement::create([
            'groupe_id' => $groupe->id,
            'membre_id' => $membre->id,
            'periode_id' => $periode?->id,
            'type' => $data['type'],
            'montant' => $montant,
            'mode' => $data['mode'],
            'statut' => 'reussi',
            'date_paiement' => $data['date_paiement'],
            'note' => $data['note'] ?? null,
            'enregistre_par' => $userId,
        ]);
        // Ledger entry + update caisse
        $caisse = $groupe->caisse ?? Caisse::create(['groupe_id' => $groupe->id, 'solde' => 0]);
        CaisseLedger::create([
            'caisse_id' => $caisse->id,
            'groupe_id' => $groupe->id,
            'type' => 'entree',
            'montant' => $montant,
            'motif' => ucfirst($data['type']) . ' - ' . ($membre->full_name),
            'date' => $data['date_paiement'],
            'paiement_id' => $p->id,
            'auteur_id' => $userId,
        ]);
        $caisse->solde += $montant;
        $caisse->save();
        return $p;
    }

    public function update(Request $request, Groupe $groupe, Paiement $paiement)
    {
        $this->authorizeGroupe($request, $groupe);
        abort_unless($paiement->groupe_id === $groupe->id, 404);
        $data = $request->validate([
            'montant' => 'sometimes|integer|min:0',
            'mode' => 'sometimes|in:cash,wave,virement,autre',
            'note' => 'nullable|string',
            'date_paiement' => 'sometimes|date',
        ]);
        $avant = $paiement->toArray();
        $delta = isset($data['montant']) ? $data['montant'] - $paiement->montant : 0;
        $paiement->update(array_merge($data, ['modifie' => true]));
        PaiementLog::create([
            'paiement_id' => $paiement->id,
            'auteur_id' => $request->user()->id,
            'avant' => $avant,
            'apres' => $paiement->toArray(),
            'action' => 'update',
        ]);
        if ($delta !== 0) {
            $caisse = $groupe->caisse;
            if ($caisse) {
                CaisseLedger::create([
                    'caisse_id' => $caisse->id,
                    'groupe_id' => $groupe->id,
                    'type' => $delta > 0 ? 'entree' : 'sortie',
                    'montant' => abs($delta),
                    'motif' => 'Ajustement paiement #' . $paiement->id,
                    'date' => now()->toDateString(),
                    'paiement_id' => $paiement->id,
                    'auteur_id' => $request->user()->id,
                ]);
                $caisse->solde += $delta;
                $caisse->save();
            }
        }
        return response()->json(['paiement' => $paiement]);
    }

    protected function authorizeGroupe(Request $request, Groupe $groupe, bool $allowMember = false): void
    {
        $u = $request->user();
        if ($u->role === 'super_admin') return;
        if ($groupe->gestionnaire_id === $u->id) return;
        if ($allowMember && $groupe->membres()->where('user_id', $u->id)->exists()) return;
        abort(403);
    }
}

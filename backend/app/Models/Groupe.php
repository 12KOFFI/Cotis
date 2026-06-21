<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

class Groupe extends Model
{
    protected $fillable = [
        'gestionnaire_id', 'nom', 'type', 'type_autre', 'description', 'logo',
        'frequence', 'montant_standard', 'montant_personnalisable',
        'date_debut', 'dates_autres',
        'adhesion_active', 'adhesion_montant',
    ];
    protected $casts = [
        'adhesion_active' => 'boolean',
        'montant_personnalisable' => 'boolean',
        'dates_autres' => 'array',
        'date_debut' => 'date',
    ];

    public function gestionnaire() { return $this->belongsTo(User::class, 'gestionnaire_id'); }
    public function membres() { return $this->hasMany(Membre::class); }
    public function invitations() { return $this->hasMany(Invitation::class); }
    public function inviteLinks() { return $this->hasMany(GroupInviteLink::class); }
    public function periodes() { return $this->hasMany(Periode::class); }
    public function paiements() { return $this->hasMany(Paiement::class); }
    public function caisse() { return $this->hasOne(Caisse::class); }
    public function adhesions() { return $this->hasMany(AdhesionFrais::class); }

    public function ensurePeriodsUpToDate(): void
    {
        $now = now()->startOfDay();

        if ($this->frequence === 'autre') {
            $customDates = collect($this->dates_autres ?? [])
                ->map(fn($d) => Carbon::parse($d)->startOfDay())
                ->filter(fn($d) => $d->greaterThanOrEqualTo(Carbon::parse($this->date_debut)->startOfDay()))
                ->sort()
                ->values();

            $start = Carbon::parse($this->date_debut)->startOfDay();
            foreach ($customDates as $date) {
                $exists = $this->periodes()->where('date_fin', $date->toDateString())->exists();
                if (!$exists && $start->lte($now)) {
                    $nbMembres = max(1, $this->membres()->whereIn('statut', ['actif', 'actif_non_verifie'])->count());
                    Periode::create([
                        'groupe_id' => $this->id,
                        'date_debut' => $start,
                        'date_fin' => $date,
                        'echeance' => $date,
                        'montant_attendu' => $this->montant_standard * $nbMembres,
                    ]);
                }
                $start = $date->copy()->addDay();
            }
            return;
        }

        $latest = $this->periodes()->latest('date_debut')->first();
        if (!$latest) {
            $start = Carbon::parse($this->date_debut)->startOfDay();
        } else {
            $start = Carbon::parse($latest->date_fin)->addDay()->startOfDay();
        }

        if ($start->gt($now)) return;

        while ($start->lte($now)) {
            $end = match ($this->frequence) {
                'hebdomadaire' => $start->copy()->addWeek()->subDay(),
                'mensuelle' => $start->copy()->addMonth()->subDay(),
                'trimestrielle' => $start->copy()->addMonths(3)->subDay(),
                'annuelle' => $start->copy()->addYear()->subDay(),
                default => $start->copy()->addMonth()->subDay(),
            };
            $nbMembres = max(1, $this->membres()->whereIn('statut', ['actif', 'actif_non_verifie'])->count());
            $periode = Periode::create([
                'groupe_id' => $this->id,
                'date_debut' => $start,
                'date_fin' => $end,
                'echeance' => $end,
                'montant_attendu' => $this->montant_standard * $nbMembres,
            ]);
            $this->consumeCreditsForPeriod($periode);
            $start = $end->copy()->addDay();
        }
    }

    public function consumeCreditsForPeriod(Periode $periode): void
    {
        $membresActifs = $this->membres()
            ->whereIn('statut', ['actif', 'actif_non_verifie'])
            ->get();

        foreach ($membresActifs as $membre) {
            $credits = CreditMembre::where('groupe_id', $this->id)
                ->where('membre_id', $membre->id)
                ->where('montant', '>', 0)
                ->whereNull('periode_appliquee_id')
                ->orderBy('created_at')
                ->get();

            if ($credits->isEmpty()) continue;

            $montantDu = $membre->montant_perso ?? $this->montant_standard;
            $montantDejaVerse = (int) Paiement::cotisationReussie($membre->id, $periode->id)
                ->sum('montant');
            $manquant = max(0, $montantDu - $montantDejaVerse);

            if ($manquant <= 0) continue;

            $resteACombler = $manquant;
            foreach ($credits as $credit) {
                if ($resteACombler <= 0) break;

                $aUtiliser = min($credit->montant, $resteACombler);

                // Créer le paiement automatique
                $paiement = Paiement::create([
                    'groupe_id'      => $this->id,
                    'membre_id'      => $membre->id,
                    'periode_id'     => $periode->id,
                    'type'           => 'cotisation',
                    'montant'        => $aUtiliser,
                    'mode'           => 'credit',
                    'statut'         => 'reussi',
                    'date_paiement'  => now()->toDateString(),
                    'note'           => 'Auto-imputé depuis crédit reporté',
                ]);

                // Mettre à jour le crédit
                $credit->montant -= $aUtiliser;
                $credit->periode_appliquee_id = $periode->id;
                $credit->save();

                $resteACombler -= $aUtiliser;
            }

            // Supprimer les crédits épuisés
            CreditMembre::where('groupe_id', $this->id)
                ->where('membre_id', $membre->id)
                ->where('montant', '<=', 0)
                ->delete();
        }
    }
}

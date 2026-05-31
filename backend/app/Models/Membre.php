<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Membre extends Model
{
    protected $fillable = [
        'groupe_id', 'user_id', 'nom', 'prenom', 'telephone',
        'email', 'role', 'statut', 'montant_perso', 'note',
        'access_token',
    ];

    protected $appends = ['full_name', 'public_token'];

    /* ---------- Relations ---------- */
    public function groupe()   { return $this->belongsTo(Groupe::class); }
    public function user()     { return $this->belongsTo(User::class); }
    public function paiements(){ return $this->hasMany(Paiement::class); }
    public function adhesion() { return $this->hasOne(AdhesionFrais::class); }
    public function credits()  { return $this->hasMany(CreditMembre::class); }

    /* ---------- Lifecycle ---------- */
    protected static function booted(): void
    {
        // Auto-generate access_token for offline members (no user_id)
        static::creating(function (Membre $membre) {
            if (!$membre->user_id && !$membre->access_token) {
                $membre->access_token = self::generateAccessToken();
            }
        });
    }

    public static function generateAccessToken(): string
    {
        return hash_hmac('sha256', Str::random(40) . microtime(), config('app.key'));
    }

    /* ---------- Accessors ---------- */
    public function getFullNameAttribute(): string
    {
        return trim(($this->prenom ?? '') . ' ' . $this->nom);
    }

    public function getPublicTokenAttribute(): string
    {
        return sha1($this->id . '.' . $this->groupe_id . '.' . config('app.key'));
    }

    /* ---------- Méthodes métier ---------- */

    /**
     * Calcule le statut de cotisation du membre pour la période donnée,
     * ou le statut global sur toutes les périodes si aucune n'est spécifiée.
     * Logique centralisée — appelée par MembreController & DashboardController.
     */
    public function computeStatutCotisation(Groupe $groupe, ?Periode $periode = null): string
    {
        if ($periode) {
            return $this->computeStatutForPeriode($groupe, $periode);
        }

        return $this->computeStatutGlobal($groupe);
    }

    private function computeStatutForPeriode(Groupe $groupe, Periode $periode): string
    {
        $montantDu = $this->montant_perso ?? $groupe->montant_standard;
        $montantVerse = (int) Paiement::cotisationReussie($this->id, $periode->id)->sum('montant');
        $echeanceDepassee = now()->gt($periode->echeance);

        // Totalité payée
        if ($montantVerse >= $montantDu) {
            return 'a_jour';
        }

        // Paiement partiel mais pas encore dépassé
        if ($montantVerse > 0 && !$echeanceDepassee) {
            return 'en_attente';
        }
        if ($montantVerse > 0 && $echeanceDepassee) {
            return 'en_retard';
        }

        // Aucun paiement
        return $echeanceDepassee ? 'impaye' : 'en_attente';
    }

    private function computeStatutGlobal(Groupe $groupe): string
    {
        $periodes = $groupe->periodes()->orderBy('date_debut')->get();
        if ($periodes->isEmpty()) return 'a_jour';

        $hasImpaye = false;
        $hasRetard = false;
        $hasEcheanceDepassee = false;

        $montantDu = $this->montant_perso ?? $groupe->montant_standard;

        $paiements = Paiement::where('membre_id', $this->id)
            ->where('groupe_id', $groupe->id)
            ->where('type', 'cotisation')
            ->where('statut', 'reussi')
            ->get();

        foreach ($periodes as $p) {
            $echeanceDepassee = now()->gt($p->echeance);

            // On s'intéresse uniquement aux échéances passées (échues)
            if ($echeanceDepassee) {
                $hasEcheanceDepassee = true;
                $paiementsPeriode = $paiements->where('periode_id', $p->id);
                $montantVerse = (int) $paiementsPeriode->sum('montant');

                if ($montantVerse < $montantDu) {
                    if ($montantVerse == 0) {
                        $hasImpaye = true;
                    } else {
                        $hasRetard = true; // Paiement partiel sur une échéance échue
                    }
                }
            }
        }

        // Règle 1 : Au moins une échéance échue n'a reçu aucun paiement
        if ($hasImpaye) return 'impaye';

        // Règle 2 : Au moins une échéance échue a été partiellement payée mais reste incomplète
        if ($hasRetard) return 'en_retard';

        // Règle 3 : Le membre a des échéances passées et elles sont toutes réglées.
        // Il n'a aucune dette exigible, il est donc "À jour".
        if ($hasEcheanceDepassee) {
            return 'a_jour';
        }

        // Règle 4 : Aucune échéance n'est encore arrivée (nouveau membre).
        // Vérifions s'il a déjà pris l'initiative de payer la période en cours.
        $premierePeriode = $periodes->first();
        $versementInitial = (int) $paiements->where('periode_id', $premierePeriode->id)->sum('montant');
        
        if ($versementInitial >= $montantDu) {
            return 'a_jour'; // Il a payé en avance sans attendre la fin de l'échéance
        }
        // Aucun paiement fait (ou paiement partiel) et aucune échéance dépassée
        return 'en_attente';
    }
}

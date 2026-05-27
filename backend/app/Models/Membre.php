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
     * Calcule le statut de cotisation du membre pour la période donnée.
     * Logique centralisée — appelée par MembreController & DashboardController.
     */
    public function computeStatutCotisation(Groupe $groupe, ?Periode $periode = null): string
    {
        if (!$periode) {
            $periode = $groupe->periodes()->latest('date_debut')->first();
        }
        if (!$periode) return 'a_jour';

        $montantDu = $this->montant_perso ?? $groupe->montant_standard;
        $montantVerse = (int) Paiement::cotisationReussie($this->id, $periode->id)->sum('montant');

        $echeanceDepassee = now()->gt($periode->echeance);

        // Totalité payée
        if ($montantVerse >= $montantDu) {
            $hasLatePayment = Paiement::cotisationReussie($this->id, $periode->id)
                ->where('date_paiement', '>', $periode->echeance)
                ->exists();
            return $hasLatePayment ? 'en_retard' : 'a_jour';
        }

        // Paiement partiel
        if ($montantVerse > 0) {
            return $echeanceDepassee ? 'en_retard' : 'partiel';
        }

        // Aucun paiement
        return $echeanceDepassee ? 'impaye' : 'en_attente';
    }
}

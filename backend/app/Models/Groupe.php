<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

class Groupe extends Model
{
    protected $guarded = [];
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
        $latest = $this->periodes()->latest('date_debut')->first();
        $now = now()->startOfDay();

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
            $nbMembres = max(1, $this->membres()->where('statut', 'actif')->count());
            Periode::create([
                'groupe_id' => $this->id,
                'date_debut' => $start,
                'date_fin' => $end,
                'echeance' => $end,
                'montant_attendu' => $this->montant_standard * $nbMembres,
            ]);
            $start = $end->copy()->addDay();
        }
    }
}

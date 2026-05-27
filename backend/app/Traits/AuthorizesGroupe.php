<?php

namespace App\Traits;

use App\Models\Groupe;
use Illuminate\Http\Request;

/**
 * Trait partagé pour l'autorisation d'accès à un groupe.
 * Utilisé par PaiementController, MembreController, DashboardController, etc.
 */
trait AuthorizesGroupe
{
    protected function authorizeGroupe(Request $request, Groupe $groupe, bool $allowMember = false): void
    {
        $currentUser = $request->user();

        if ($currentUser->role === 'super_admin') return;
        if ($groupe->gestionnaire_id === $currentUser->id) return;

        $membreRecord = $groupe->membres()->where('user_id', $currentUser->id)->first();
        if ($membreRecord?->role === 'tresorier') return;
        if ($allowMember && $membreRecord) return;

        abort(403, 'Accès refusé');
    }
}

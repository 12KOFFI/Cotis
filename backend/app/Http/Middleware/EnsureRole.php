<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

/**
 * Middleware de vérification de rôle — protège les routes admin
 * contre tout accès non autorisé, même si un développeur oublie
 * d'ajouter une vérification dans le contrôleur.
 *
 * Usage : Route::middleware('role:super_admin')->group(...)
 */
class EnsureRole
{
    public function handle(Request $request, Closure $next, string $role): mixed
    {
        abort_unless(
            $request->user()?->role === $role,
            403,
            'Accès interdit : rôle ' . $role . ' requis.'
        );

        return $next($request);
    }
}

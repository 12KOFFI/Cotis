<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Groupe;
use App\Models\Paiement;
use App\Models\Invitation;
use Illuminate\Http\Request;

class SuperAdminController extends Controller
{
    public function __construct()
    {
        // auth handled by middleware; additional role check per method
    }

    public function overview(Request $request)
    {
        $this->ensure($request);
        return response()->json([
            'users' => User::count(),
            'gestionnaires' => User::where('role', 'gestionnaire')->count(),
            'membres' => User::where('role', 'membre')->count(),
            'groupes' => Groupe::count(),
            'paiements_total' => (int) Paiement::where('statut', 'reussi')->sum('montant'),
            'invitations_envoyees' => Invitation::count(),
            'derniers_groupes' => Groupe::latest()->limit(10)->get(['id', 'nom', 'type', 'plan', 'created_at']),
            'derniers_users' => User::latest()->limit(10)->get(['id', 'name', 'email', 'role', 'created_at']),
        ]);
    }

    public function users(Request $request)
    {
        $this->ensure($request);
        return response()->json(['users' => User::latest()->limit(200)->get()]);
    }

    public function groupes(Request $request)
    {
        $this->ensure($request);
        return response()->json(['groupes' => Groupe::with('gestionnaire')->withCount('membres')->latest()->get()]);
    }

    protected function ensure(Request $request): void
    {
        abort_unless($request->user()?->role === 'super_admin', 403, 'Accès super admin requis');
    }
}

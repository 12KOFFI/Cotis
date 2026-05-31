<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Groupe;
use App\Models\Paiement;
use App\Models\Payout;
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
            'commissions_total' => (int) Paiement::where('statut', 'reussi')->sum('commission_plateforme'),
            'frais_gateway_total' => (int) Paiement::where('statut', 'reussi')->sum('frais_gateway'),
            'invitations_envoyees' => Invitation::count(),
            'derniers_groupes' => Groupe::latest()->limit(10)->get(['id', 'nom', 'type', 'plan', 'created_at']),
            'derniers_users' => User::latest()->limit(10)->get(['id', 'name', 'email', 'role', 'created_at']),
            'derniers_paiements' => Paiement::with(['groupe:id,nom', 'membre:id,nom,prenom'])
                                        ->latest()
                                        ->limit(15)
                                        ->get([
                                            'id', 'groupe_id', 'membre_id', 'montant', 'montant_membre', 
                                            'commission_plateforme', 'frais_gateway', 'statut', 'mode', 'date_paiement'
                                        ]),
        ]);
    }

    public function users(Request $request)
    {
        $this->ensure($request);
        return response()->json(['users' => User::latest()->limit(200)->get()]);
    }

    public function updateUserPassword(Request $request)
    {
        $this->ensure($request);
        $data = $request->validate([
            'email' => 'required|email|exists:users,email',
            'password' => 'required|string|min:6',
        ]);

        $user = User::where('email', $data['email'])->firstOrFail();
        $user->password = \Illuminate\Support\Facades\Hash::make($data['password']);
        $user->save();

        return response()->json(['message' => 'Mot de passe mis à jour avec succès.', 'user' => $user]);
    }

    public function groupes(Request $request)
    {
        $this->ensure($request);
        return response()->json(['groupes' => Groupe::with('gestionnaire')->withCount('membres')->latest()->get()]);
    }

    /**
     * TÂCHE 5 — Liste paginée des payouts avec filtres.
     * Read-only, aucune action de validation ici.
     */
    public function payouts(Request $request)
    {
        $this->ensure($request);

        $query = Payout::with(['groupe:id,nom', 'user:id,name,email'])
            ->latest('created_at');

        // Filtres optionnels
        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }
        if ($from = $request->query('from')) {
            $query->whereDate('created_at', '>=', $from);
        }
        if ($to = $request->query('to')) {
            $query->whereDate('created_at', '<=', $to);
        }
        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('recipient_phone', 'like', "%{$search}%")
                  ->orWhere('recipient_name', 'like', "%{$search}%")
                  ->orWhere('provider_reference', 'like', "%{$search}%")
                  ->orWhere('idempotency_key', 'like', "%{$search}%");
            });
        }
        if ($groupeId = $request->query('groupe_id')) {
            $query->where('groupe_id', $groupeId);
        }

        $perPage = min((int) $request->query('per_page', 20), 100);
        $paginated = $query->paginate($perPage);

        // KPIs agrégés (sur toute la période filtrée, pas juste la page)
        $statsQuery = Payout::query();
        if ($from) $statsQuery->whereDate('created_at', '>=', $from);
        if ($to)   $statsQuery->whereDate('created_at', '<=', $to);

        $stats = [
            'total_count'   => $statsQuery->count(),
            'total_paid'    => (int) (clone $statsQuery)->where('status', 'paid')->sum('amount'),
            'total_failed'  => (int) (clone $statsQuery)->where('status', 'failed')->count(),
            'total_pending' => (int) (clone $statsQuery)->where('status', 'pending')->count(),
        ];

        return response()->json([
            'data'  => $paginated->items(),
            'meta'  => [
                'current_page' => $paginated->currentPage(),
                'last_page'    => $paginated->lastPage(),
                'per_page'     => $paginated->perPage(),
                'total'        => $paginated->total(),
            ],
            'stats' => $stats,
        ]);
    }

    /**
     * TÂCHE 6 — Solde exact par groupe, calculé depuis le ledger.
     * Retourne chaque groupe avec ses soldes (total + retirable Wave).
     */
    public function groupesSoldes(Request $request)
    {
        $this->ensure($request);

        $groupes = Groupe::with('gestionnaire:id,name')
            ->has('caisse')
            ->withCount('membres')
            ->latest()
            ->get();

        $result = $groupes->map(function ($groupe) {
            $caisse = $groupe->caisse;
            $agg    = $caisse->aggregats();

            // Total des payouts réussis pour ce groupe
            $totalPayouts = (int) Payout::where('groupe_id', $groupe->id)
                ->whereIn('status', ['paid', 'completed'])
                ->sum('amount');

            return [
                'id'                => $groupe->id,
                'nom'               => $groupe->nom,
                'type'              => $groupe->type,
                'gestionnaire'      => $groupe->gestionnaire->name ?? '—',
                'membres_count'     => $groupe->membres_count,
                'solde_total'       => $agg['solde_total'],
                'solde_disponible'  => $agg['solde_disponible'],
                'total_entrees'     => $agg['total_entrees'],
                'total_sorties'     => $agg['total_sorties'],
                'total_payouts'     => $totalPayouts,
                'created_at'        => $groupe->created_at,
            ];
        });

        // Agrégats globaux
        $globalStats = [
            'total_solde'       => $result->sum('solde_total'),
            'total_disponible'  => $result->sum('solde_disponible'),
            'total_entrees'     => $result->sum('total_entrees'),
            'total_sorties'     => $result->sum('total_sorties'),
            'total_payouts'     => $result->sum('total_payouts'),
        ];

        return response()->json([
            'groupes' => $result->values(),
            'stats'   => $globalStats,
        ]);
    }

    protected function ensure(Request $request): void
    {
        abort_unless($request->user()?->role === 'super_admin', 403, 'Accès super admin requis');
    }
}

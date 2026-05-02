<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Groupe;
use App\Models\Invitation;
use App\Models\Membre;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class InvitationController extends Controller
{
    public function index(Request $request, Groupe $groupe)
    {
        $this->authorizeGroupe($request, $groupe);
        $invs = $groupe->invitations()->with('membre')->latest()->get();
        return response()->json(['invitations' => $invs]);
    }

    public function store(Request $request, Groupe $groupe)
    {
        $this->authorizeGroupe($request, $groupe);
        $data = $request->validate([
            'nom' => 'nullable|string',
            'prenom' => 'nullable|string',
            'telephone' => 'nullable|string',
            'email' => 'nullable|email',
            'canal' => 'required|in:sms,whatsapp,email,lien',
            'membre_id' => 'nullable|exists:membres,id',
        ]);
        // Create placeholder membre if not provided
        $membreId = $data['membre_id'] ?? null;
        if (!$membreId && ($data['nom'] ?? null)) {
            $m = Membre::create([
                'groupe_id' => $groupe->id,
                'nom' => $data['nom'],
                'prenom' => $data['prenom'] ?? null,
                'telephone' => $data['telephone'] ?? null,
                'email' => $data['email'] ?? null,
                'role' => 'membre',
                'statut' => 'actif_non_verifie',
            ]);
            $membreId = $m->id;
        }
        $inv = Invitation::create([
            'groupe_id' => $groupe->id,
            'membre_id' => $membreId,
            'token' => Str::random(48),
            'telephone' => $data['telephone'] ?? null,
            'email' => $data['email'] ?? null,
            'canal' => $data['canal'],
            'statut' => 'envoyee',
            'expire_at' => now()->addDays(14),
        ]);
        $frontUrl = config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:3000'));
        $inv->link = $frontUrl . '/invitation?token=' . $inv->token;
        // In production: dispatch SMS/WhatsApp/Email job. For MVP return link.
        return response()->json(['invitation' => $inv], 201);
    }

    public function verify(Request $request, string $token)
    {
        $inv = Invitation::where('token', $token)->with('groupe', 'membre')->firstOrFail();
        if ($inv->expire_at && $inv->expire_at->isPast()) {
            $inv->statut = 'expiree';
            $inv->save();
        }
        return response()->json(['invitation' => $inv]);
    }

    protected function authorizeGroupe(Request $request, Groupe $groupe): void
    {
        abort_unless($groupe->gestionnaire_id === $request->user()->id || $request->user()->role === 'super_admin', 403);
    }
}

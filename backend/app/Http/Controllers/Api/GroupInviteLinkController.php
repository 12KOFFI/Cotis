<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Groupe;
use App\Models\GroupInviteLink;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class GroupInviteLinkController extends Controller
{
    public function show(Request $request, Groupe $groupe)
    {
        $this->authorizeGroupe($request, $groupe);
        $link = $groupe->inviteLinks()->latest()->first();

        return response()->json(['link' => $link ? $this->formatLink($request, $link) : null]);
    }

    public function store(Request $request, Groupe $groupe)
    {
        $this->authorizeGroupe($request, $groupe);
        $data = $request->validate([
            'expires_in_days' => 'nullable|integer|min:1|max:365',
            'max_uses' => 'nullable|integer|min:1|max:10000',
            'target_name' => 'nullable|string|max:120',
            'target_prenom' => 'nullable|string|max:120',
            'montant_perso' => 'nullable|integer|min:0',
        ]);

        $isPersonalized = !empty($data['target_name']) || !empty($data['target_prenom']) || isset($data['montant_perso']);

        if (!$isPersonalized) {
            // Désactiver uniquement les anciens liens publics
            $groupe->inviteLinks()
                   ->where('active', true)
                   ->whereNull('target_name')
                   ->whereNull('target_prenom')
                   ->whereNull('montant_perso')
                   ->update(['active' => false]);
        }

        $link = GroupInviteLink::create([
            'groupe_id' => $groupe->id,
            'created_by' => $request->user()->id,
            'token' => Str::random(64),
            'expires_at' => now()->addDays($data['expires_in_days'] ?? 30),
            'active' => true,
            'max_uses' => $data['max_uses'] ?? null,
            'target_name' => $data['target_name'] ?? null,
            'target_prenom' => $data['target_prenom'] ?? null,
            'montant_perso' => $data['montant_perso'] ?? null,
        ]);

        return response()->json(['link' => $this->formatLink($request, $link)], 201);
    }

    public function destroy(Request $request, Groupe $groupe)
    {
        $this->authorizeGroupe($request, $groupe);
        
        $linkId = $request->query('link_id');
        if ($linkId) {
            $groupe->inviteLinks()->where('id', $linkId)->update(['active' => false]);
        } else {
            $groupe->inviteLinks()->where('active', true)->update(['active' => false]);
        }

        return response()->json(['ok' => true]);
    }

    protected function authorizeGroupe(Request $request, Groupe $groupe): void
    {
        abort_unless($groupe->gestionnaire_id === $request->user()->id || $request->user()->role === 'super_admin', 403);
    }

    protected function formatLink(Request $request, GroupInviteLink $link): array
    {
        $frontUrl = $request->headers->get('origin')
            ?: config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:3000'));

        return [
            'id' => $link->id,
            'token' => $link->token,
            'url' => $frontUrl . '/join/' . $link->token,
            'expires_at' => $link->expires_at,
            'active' => $link->active,
            'uses_count' => $link->uses_count,
            'max_uses' => $link->max_uses,
            'target_name' => $link->target_name,
            'target_prenom' => $link->target_prenom,
            'montant_perso' => $link->montant_perso,
        ];
    }
}

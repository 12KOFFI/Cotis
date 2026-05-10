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
        ]);

        $groupe->inviteLinks()->update(['active' => false]);

        $link = GroupInviteLink::create([
            'groupe_id' => $groupe->id,
            'created_by' => $request->user()->id,
            'token' => Str::random(64),
            'expires_at' => now()->addDays($data['expires_in_days'] ?? 30),
            'active' => true,
            'max_uses' => $data['max_uses'] ?? null,
        ]);

        return response()->json(['link' => $this->formatLink($request, $link)], 201);
    }

    public function destroy(Request $request, Groupe $groupe)
    {
        $this->authorizeGroupe($request, $groupe);
        $groupe->inviteLinks()->where('active', true)->update(['active' => false]);

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
        ];
    }
}

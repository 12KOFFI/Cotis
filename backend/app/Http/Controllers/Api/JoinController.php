<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GroupInviteLink;
use App\Models\Membre;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Laravel\Sanctum\PersonalAccessToken;

class JoinController extends Controller
{
    public function show(string $token)
    {
        $link = GroupInviteLink::where('token', $token)->with('groupe')->first();

        if (!$link || !$link->isValid()) {
            return response()->json(['valid' => false, 'message' => 'Lien invalide ou expiré'], 404);
        }

        return response()->json([
            'valid' => true,
            'groupe' => [
                'id' => $link->groupe->id,
                'nom' => $link->groupe->nom,
                'type' => $link->groupe->type,
                'logo' => $link->groupe->logo,
                'montant_standard' => $link->groupe->montant_standard,
            ],
            'expires_at' => $link->expires_at,
            'target_name' => $link->target_name,
            'target_prenom' => $link->target_prenom,
            'montant_perso' => $link->montant_perso,
        ]);
    }

    public function join(Request $request, string $token)
    {
        $link = GroupInviteLink::where('token', $token)->with('groupe')->first();

        if (!$link || !$link->isValid()) {
            return response()->json(['message' => 'Lien invalide ou expiré'], 410);
        }

        $data = $request->validate([
            'nom' => 'required|string|max:120',
            'prenom' => 'nullable|string|max:120',
            'telephone' => 'nullable|string|max:30',
            'email' => 'required|email|max:160',
            'password' => 'nullable|string|min:6|confirmed',
        ]);

        $user = $this->resolveUser($request);
        $email = $data['email'];
        $existingUser = User::where('email', $email)->first();

        if (!$user && $existingUser) {
            if (!($data['password'] ?? null) || !Hash::check($data['password'], $existingUser->password)) {
                throw ValidationException::withMessages(['email' => 'Cet email existe déjà. Connectez-vous ou saisissez le bon mot de passe.']);
            }
            $user = $existingUser;
        }

        if (!$user) {
            if (!($data['password'] ?? null)) {
                throw ValidationException::withMessages(['password' => 'Le mot de passe est requis pour créer votre compte.']);
            }
            $user = User::create([
                'name' => trim(($data['prenom'] ?? '') . ' ' . $data['nom']),
                'email' => $email,
                'telephone' => $data['telephone'] ?? null,
                'password' => Hash::make($data['password']),
                'role' => 'membre',
            ]);
        }

        $alreadyMember = Membre::where('groupe_id', $link->groupe_id)->where('user_id', $user->id)->first();
        if ($alreadyMember) {
            return response()->json([
                'message' => 'Vous êtes déjà membre de ce groupe',
                'user' => $user,
                'membre' => $alreadyMember->load('groupe'),
                'token' => $user->createToken('api')->plainTextToken,
            ]);
        }

        $membre = Membre::create([
            'groupe_id' => $link->groupe_id,
            'user_id' => $user->id,
            'nom' => $data['nom'],
            'prenom' => $data['prenom'] ?? null,
            'telephone' => $data['telephone'] ?? $user->telephone,
            'email' => $email,
            'role' => 'membre',
            'statut' => 'actif_non_verifie',
            'montant_perso' => $link->montant_perso,
        ]);

        $link->increment('uses_count');

        return response()->json([
            'user' => $user,
            'token' => $user->createToken('api')->plainTextToken,
            'membre' => $membre->load('groupe'),
        ], 201);
    }

    protected function resolveUser(Request $request): ?User
    {
        $token = $request->bearerToken();
        if (!$token) return null;

        $accessToken = PersonalAccessToken::findToken($token);
        return $accessToken?->tokenable instanceof User ? $accessToken->tokenable : null;
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Invitation;
use App\Models\Membre;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:120',
            'email' => 'required|email|unique:users,email',
            'telephone' => 'nullable|string|max:30',
            'password' => 'required|string|min:6|confirmed',
        ]);
        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'telephone' => $data['telephone'] ?? null,
            'password' => Hash::make($data['password']),
            'role' => 'gestionnaire',
        ]);
        $token = $user->createToken('api')->plainTextToken;
        return response()->json(['user' => $user, 'token' => $token]);
    }

    public function login(Request $request)
    {
        $data = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);
        $user = User::where('email', $data['email'])->first();
        if (!$user || !Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages(['email' => 'Identifiants invalides']);
        }
        $token = $user->createToken('api')->plainTextToken;
        return response()->json(['user' => $user, 'token' => $token]);
    }

    public function me(Request $request)
    {
        return response()->json(['user' => $request->user()]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()?->delete();
        return response()->json(['ok' => true]);
    }

    // Magic link: consume invitation token and auto-create user/membre if needed
    public function acceptInvitation(Request $request)
    {
        $data = $request->validate([
            'token' => 'required|string',
            'nom' => 'nullable|string',
            'prenom' => 'nullable|string',
        ]);
        $inv = Invitation::where('token', $data['token'])->firstOrFail();
        if ($inv->statut === 'expiree' || ($inv->expire_at && $inv->expire_at->isPast())) {
            return response()->json(['message' => 'Invitation expirée'], 410);
        }
        // Find or create user
        $user = null;
        if ($inv->email) {
            $user = User::firstOrCreate(['email' => $inv->email], [
                'name' => trim(($data['prenom'] ?? '') . ' ' . ($data['nom'] ?? $inv->email)),
                'password' => Hash::make(Str::random(24)),
                'role' => 'membre',
                'telephone' => $inv->telephone,
            ]);
        } elseif ($inv->telephone) {
            $user = User::firstOrCreate(['telephone' => $inv->telephone], [
                'name' => trim(($data['prenom'] ?? '') . ' ' . ($data['nom'] ?? $inv->telephone)),
                'email' => $inv->telephone . '@invite.local',
                'password' => Hash::make(Str::random(24)),
                'role' => 'membre',
            ]);
        }
        // Link membre
        $membre = $inv->membre;
        if ($membre && !$membre->user_id) {
            $membre->user_id = $user->id;
            if ($data['nom'] ?? null) $membre->nom = $data['nom'];
            if ($data['prenom'] ?? null) $membre->prenom = $data['prenom'];
            $membre->save();
        } elseif (!$membre) {
            $membre = Membre::create([
                'groupe_id' => $inv->groupe_id,
                'user_id' => $user->id,
                'nom' => $data['nom'] ?? ($user->name ?? ''),
                'prenom' => $data['prenom'] ?? null,
                'telephone' => $inv->telephone,
                'email' => $inv->email,
                'role' => 'membre',
                'statut' => 'actif_non_verifie',
            ]);
            $inv->membre_id = $membre->id;
        }
        $inv->statut = 'acceptee';
        $inv->acceptee_at = now();
        $inv->save();

        $token = $user->createToken('api')->plainTextToken;
        return response()->json([
            'user' => $user,
            'token' => $token,
            'membre' => $membre->load('groupe'),
        ]);
    }
}

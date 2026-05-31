<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\GroupeController;
use App\Http\Controllers\Api\MembreController;
use App\Http\Controllers\Api\InvitationController;
use App\Http\Controllers\Api\PaiementController;
use App\Http\Controllers\Api\CaisseController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\CarteController;
use App\Http\Controllers\Api\ExportController;
use App\Http\Controllers\Api\SuperAdminController;
use App\Http\Controllers\Api\GroupInviteLinkController;
use App\Http\Controllers\Api\JoinController;
use App\Http\Controllers\Api\GeniusPayWebhookController;
use App\Http\Controllers\Api\MembreAccesController;

use App\Http\Controllers\Api\AdminMerchantController;

// Public
Route::middleware('throttle:10,1')->post('/auth/register', [AuthController::class, 'register']);
Route::middleware('throttle:6,1')->post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/accept-invitation', [AuthController::class, 'acceptInvitation']);
Route::get('/invitations/{token}', [InvitationController::class, 'verify']);
Route::get('/join/{token}', [JoinController::class, 'show']);
Route::post('/join/{token}', [JoinController::class, 'join']);
Route::get('/public/membre/{membre}/history', [CarteController::class, 'publicHistory']);
Route::get('/public/gestionnaire/{user}/portail', [CarteController::class, 'publicPortail']);
Route::get('/public/gestionnaire/{user}/groupes/{groupe}/membres', [CarteController::class, 'publicPortailMembres']);
Route::get('/public/gestionnaire/{user}/groupes/{groupe}/membres/{membre}/paiements', [CarteController::class, 'publicPortailPaiements']);

Route::get('/public/profil/{user}', [CarteController::class, 'publicProfil']);
Route::get('/public/profil/{user}/groupes/{groupe}/paiements', [CarteController::class, 'publicProfilPaiements']);
Route::post('/webhooks/geniuspay', [GeniusPayWebhookController::class, 'handle']);
Route::get('/acces/{token}', [MembreAccesController::class, 'show']);

// Authenticated
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    // Groupes (gestionnaire)
    Route::get('/groupes', [GroupeController::class, 'index']);
    Route::post('/groupes', [GroupeController::class, 'store']);
    Route::get('/groupes/{groupe}', [GroupeController::class, 'show']);
    Route::put('/groupes/{groupe}', [GroupeController::class, 'update']);
    Route::delete('/groupes/{groupe}', [GroupeController::class, 'destroy']);

    // Dashboards
    Route::get('/groupes/{groupe}/dashboard', [DashboardController::class, 'gestionnaire']);
    Route::get('/groupes/{groupe}/mon-dashboard', [DashboardController::class, 'membre']);

    // Membres
    Route::get('/groupes/{groupe}/membres', [MembreController::class, 'index']);
    Route::post('/groupes/{groupe}/membres', [MembreController::class, 'store']);
    Route::get('/groupes/{groupe}/membres/{membre}', [MembreController::class, 'show']);
    Route::put('/groupes/{groupe}/membres/{membre}', [MembreController::class, 'update']);
    Route::delete('/groupes/{groupe}/membres/{membre}', [MembreController::class, 'destroy']);
    Route::post('/groupes/{groupe}/membres/{membre}/tresorier', [MembreController::class, 'assignTresorier']);

    // Invitations
    Route::get('/groupes/{groupe}/invitations', [InvitationController::class, 'index']);
    Route::post('/groupes/{groupe}/invitations', [InvitationController::class, 'store']);
    Route::get('/groupes/{groupe}/invite-link', [GroupInviteLinkController::class, 'show']);
    Route::post('/groupes/{groupe}/invite-link', [GroupInviteLinkController::class, 'store']);
    Route::delete('/groupes/{groupe}/invite-link', [GroupInviteLinkController::class, 'destroy']);

    // Paiements
    Route::get('/groupes/{groupe}/paiements', [PaiementController::class, 'index']);
    Route::post('/groupes/{groupe}/paiements', [PaiementController::class, 'store']);
    Route::put('/groupes/{groupe}/paiements/{paiement}', [PaiementController::class, 'update']);
    Route::get('/groupes/{groupe}/mes-paiements', [PaiementController::class, 'mesPaiements']);
    Route::post('/groupes/{groupe}/paiements/initier', [PaiementController::class, 'initierPaiement']);
    Route::post('/groupes/{groupe}/paiements/{paiement}/verifier', [PaiementController::class, 'verifierPaiement']);

    Route::get('/groupes/{groupe}/paiements/{paiement}/preuve', [PaiementController::class, 'preuveImage']);

    // Caisse
    Route::get('/groupes/{groupe}/caisse', [CaisseController::class, 'show']);
    Route::post('/groupes/{groupe}/caisse/decaissement', [CaisseController::class, 'decaisser']);
    Route::get('/groupes/{groupe}/caisse/calculate-fees', [CaisseController::class, 'calculateFees']);
    Route::post('/groupes/{groupe}/caisse/payout', [CaisseController::class, 'payout']);

    // Carte virtuelle
    Route::get('/groupes/{groupe}/membres/{membre}/carte', [CarteController::class, 'show']);
    Route::get('/groupes/{groupe}/membres/{membre}/carte/pdf', [CarteController::class, 'pdf']);
    Route::get('/carte/portail', [CarteController::class, 'portail']);
    Route::get('/carte/portail/pdf', [CarteController::class, 'portailPdf']);
    
    // Carte unifiée pour Membre (Profil)
    Route::get('/carte/profil', [CarteController::class, 'profil']);
    Route::get('/carte/profil/pdf', [CarteController::class, 'profilPdf']);

    // Export
    Route::get('/groupes/{groupe}/export/csv', [ExportController::class, 'csv']);
    Route::get('/groupes/{groupe}/export/pdf', [ExportController::class, 'pdf']);

    // Super Admin
    Route::prefix('admin')->group(function () {
        Route::get('/overview', [SuperAdminController::class, 'overview']);
        Route::get('/users', [SuperAdminController::class, 'users']);
        Route::post('/users/update-password', [SuperAdminController::class, 'updateUserPassword']);
        Route::get('/groupes', [SuperAdminController::class, 'groupes']);
        Route::get('/payouts', [SuperAdminController::class, 'payouts']);
        Route::get('/groupes-soldes', [SuperAdminController::class, 'groupesSoldes']);

        // Merchant Gateway (TÂCHE 1 — GeniusPay)
        Route::get('/merchant/dashboard', [AdminMerchantController::class, 'dashboard']);
        Route::get('/merchant/payouts', [AdminMerchantController::class, 'payouts']);
        Route::get('/merchant/payouts/{reference}', [AdminMerchantController::class, 'payoutDetails']);
        Route::get('/merchant/transactions/{reference}', [AdminMerchantController::class, 'transactionDetails']);
    });
});


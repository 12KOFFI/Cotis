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
use App\Http\Controllers\Api\WaveWebhookController;

// Public
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/accept-invitation', [AuthController::class, 'acceptInvitation']);
Route::get('/invitations/{token}', [InvitationController::class, 'verify']);
Route::get('/public/membre/{membre}/history', [CarteController::class, 'publicHistory']);
Route::post('/webhooks/wave', [WaveWebhookController::class, 'handle']);

// Authenticated
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    // Groupes (gestionnaire)
    Route::get('/groupes', [GroupeController::class, 'index']);
    Route::post('/groupes', [GroupeController::class, 'store']);
    Route::get('/groupes/{groupe}', [GroupeController::class, 'show']);
    Route::put('/groupes/{groupe}', [GroupeController::class, 'update']);

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

    // Paiements
    Route::get('/groupes/{groupe}/paiements', [PaiementController::class, 'index']);
    Route::post('/groupes/{groupe}/paiements', [PaiementController::class, 'store']);
    Route::put('/groupes/{groupe}/paiements/{paiement}', [PaiementController::class, 'update']);
    Route::get('/groupes/{groupe}/mes-paiements', [PaiementController::class, 'mesPaiements']);

    // Caisse
    Route::get('/groupes/{groupe}/caisse', [CaisseController::class, 'show']);
    Route::post('/groupes/{groupe}/caisse/decaissement', [CaisseController::class, 'decaisser']);

    // Carte virtuelle
    Route::get('/groupes/{groupe}/membres/{membre}/carte', [CarteController::class, 'show']);
    Route::get('/groupes/{groupe}/membres/{membre}/carte/pdf', [CarteController::class, 'pdf']);

    // Export
    Route::get('/groupes/{groupe}/export/csv', [ExportController::class, 'csv']);
    Route::get('/groupes/{groupe}/export/pdf', [ExportController::class, 'pdf']);

    // Super Admin
    Route::prefix('admin')->group(function () {
        Route::get('/overview', [SuperAdminController::class, 'overview']);
        Route::get('/users', [SuperAdminController::class, 'users']);
        Route::get('/groupes', [SuperAdminController::class, 'groupes']);
    });
});

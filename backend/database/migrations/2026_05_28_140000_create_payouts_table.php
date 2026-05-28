<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Table de traçabilité des payouts (retraits) exécutés via GeniusPay.
 * Sert de journal d'audit local, indépendant de l'API externe.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payouts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('groupe_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->comment('Qui a initié le retrait');

            // Montants (en centimes de FCFA / XOF)
            $table->unsignedBigInteger('amount')->comment('Montant brut demandé');
            $table->unsignedBigInteger('gateway_fees')->default(0)->comment('Frais GeniusPay (1.5%)');
            $table->unsignedBigInteger('platform_commission')->default(0)->comment('Commission plateforme (0.5%)');
            $table->unsignedBigInteger('net_amount')->default(0)->comment('Net reçu sur Wave');

            // Destination
            $table->string('recipient_phone', 30);
            $table->string('recipient_name', 200)->nullable();
            $table->string('destination_provider', 30)->default('wave');

            // GeniusPay tracking
            $table->string('wallet_id', 60)->nullable()->comment('ID wallet GeniusPay utilisé');
            $table->string('idempotency_key', 100)->unique()->comment('Clé anti-double soumission');
            $table->string('provider_reference', 100)->nullable()->comment('Référence retournée par GeniusPay');

            // Statut
            $table->enum('status', ['pending', 'paid', 'failed', 'cancelled'])->default('pending');
            $table->string('failure_reason', 500)->nullable();
            $table->string('failure_code', 60)->nullable();

            $table->timestamps();

            // Index pour les requêtes fréquentes
            $table->index(['groupe_id', 'status']);
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payouts');
    }
};

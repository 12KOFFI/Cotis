<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Ajout des index manquants sur les tables à forte lecture.
 * Identifié lors de la revue de code pré-production (BUG-07).
 *
 * Impact attendu : amélioration significative des temps de réponse
 * pour le dashboard gestionnaire et les calculs de solde caisse.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('caisse_ledgers', function (Blueprint $table) {
            $table->index('caisse_id', 'idx_ledger_caisse');
            $table->index(['groupe_id', 'type'], 'idx_ledger_groupe_type');
        });

        Schema::table('paiements', function (Blueprint $table) {
            $table->index(['membre_id', 'periode_id', 'type', 'statut'], 'idx_paiements_cotisation_lookup');
            $table->index('statut', 'idx_paiements_statut');
        });
    }

    public function down(): void
    {
        Schema::table('caisse_ledgers', function (Blueprint $table) {
            $table->dropIndex('idx_ledger_caisse');
            $table->dropIndex('idx_ledger_groupe_type');
        });

        Schema::table('paiements', function (Blueprint $table) {
            $table->dropIndex('idx_paiements_cotisation_lookup');
            $table->dropIndex('idx_paiements_statut');
        });
    }
};

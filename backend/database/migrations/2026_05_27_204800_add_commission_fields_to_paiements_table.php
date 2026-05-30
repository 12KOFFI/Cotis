<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('paiements', function (Blueprint $table) {
            if (!Schema::hasColumn('paiements', 'montant_membre')) {
                $table->unsignedBigInteger('montant_membre')
                      ->nullable()
                      ->comment('Montant net reçu par le groupe');
            }
            if (!Schema::hasColumn('paiements', 'commission_plateforme')) {
                $table->unsignedBigInteger('commission_plateforme')
                      ->nullable()
                      ->comment('Commission 1% pour CotisPro');
            }
            if (!Schema::hasColumn('paiements', 'frais_gateway')) {
                $table->unsignedBigInteger('frais_gateway')
                      ->nullable()
                      ->comment('Frais 2.5%+100F prélevés par Genius Pay');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('paiements', function (Blueprint $table) {
            $table->dropColumn(['montant_membre', 'commission_plateforme', 'frais_gateway']);
        });
    }
};

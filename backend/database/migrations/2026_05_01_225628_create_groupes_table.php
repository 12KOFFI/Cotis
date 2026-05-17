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
        Schema::create('groupes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('gestionnaire_id')->constrained('users')->cascadeOnDelete();
            $table->string('nom');
            $table->enum('type', ['tontine', 'cooperative', 'association', 'autre'])->default('tontine');
            $table->text('description')->nullable();
            $table->string('logo')->nullable();
            // Adhésion
            $table->boolean('adhesion_active')->default(false);
            $table->unsignedBigInteger('adhesion_montant')->nullable()->default(0);
            // Cotisation
            $table->enum('frequence', ['hebdomadaire', 'mensuelle', 'trimestrielle', 'annuelle', 'autre'])->default('mensuelle');
            $table->json('dates_autres')->nullable(); // pour "Autre" : tableau de dates
            $table->unsignedBigInteger('montant_standard')->default(0);
            $table->boolean('montant_personnalisable')->default(false);
            $table->date('date_debut')->nullable();
            // Wave
            $table->string('wave_numero')->nullable();
            $table->string('wave_pays', 3)->default('CI');
            $table->enum('plan', ['gratuit', 'pro'])->default('gratuit');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('groupes');
    }
};

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
        Schema::create('periodes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('groupe_id')->constrained()->cascadeOnDelete();
            $table->date('date_debut');
            $table->date('date_fin');
            $table->date('echeance');
            $table->unsignedBigInteger('montant_attendu');
            $table->enum('statut', ['ouverte', 'cloturee'])->default('ouverte');
            $table->timestamps();
            $table->index(['groupe_id', 'date_debut']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('periodes');
    }
};

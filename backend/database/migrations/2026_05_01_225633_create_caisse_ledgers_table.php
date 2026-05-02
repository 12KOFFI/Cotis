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
        Schema::create('caisse_ledgers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('caisse_id')->constrained()->cascadeOnDelete();
            $table->foreignId('groupe_id')->constrained()->cascadeOnDelete();
            $table->enum('type', ['entree', 'sortie']);
            $table->bigInteger('montant');
            $table->string('motif');
            $table->string('beneficiaire')->nullable();
            $table->date('date');
            $table->foreignId('paiement_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('auteur_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('caisse_ledgers');
    }
};

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
        Schema::create('membres', function (Blueprint $table) {
            $table->id();
            $table->foreignId('groupe_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('nom');
            $table->string('prenom')->nullable();
            $table->string('telephone')->nullable();
            $table->string('email')->nullable();
            $table->enum('role', ['gestionnaire', 'tresorier', 'membre'])->default('membre');
            $table->enum('statut', ['actif_non_verifie', 'actif', 'suspendu'])->default('actif_non_verifie');
            $table->unsignedBigInteger('montant_perso')->nullable();
            $table->text('note')->nullable();
            $table->timestamps();
            $table->unique(['groupe_id', 'user_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('membres');
    }
};

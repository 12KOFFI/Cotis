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
        Schema::create('paiements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('groupe_id')->constrained()->cascadeOnDelete();
            $table->foreignId('membre_id')->constrained()->cascadeOnDelete();
            $table->foreignId('periode_id')->nullable()->constrained()->nullOnDelete();
            $table->enum('type', ['cotisation', 'adhesion', 'autre'])->default('cotisation');
            $table->unsignedBigInteger('montant');
            $table->enum('mode', ['wave', 'cash', 'virement', 'autre'])->default('cash');
            $table->enum('statut', ['en_attente', 'reussi', 'echoue', 'annule'])->default('reussi');
            $table->date('date_paiement');
            $table->string('transaction_id')->nullable()->unique();
            $table->text('note')->nullable();
            $table->boolean('modifie')->default(false);
            $table->json('historique')->nullable();
            $table->foreignId('enregistre_par')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->index(['groupe_id', 'membre_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('paiements');
    }
};

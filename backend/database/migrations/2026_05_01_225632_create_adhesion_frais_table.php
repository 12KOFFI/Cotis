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
        Schema::create('adhesion_frais', function (Blueprint $table) {
            $table->id();
            $table->foreignId('groupe_id')->constrained()->cascadeOnDelete();
            $table->foreignId('membre_id')->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('montant_du');
            $table->unsignedBigInteger('montant_paye')->default(0);
            $table->enum('statut', ['non_paye', 'paye'])->default('non_paye');
            $table->timestamp('paye_at')->nullable();
            $table->timestamps();
            $table->unique(['groupe_id', 'membre_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('adhesion_frais');
    }
};

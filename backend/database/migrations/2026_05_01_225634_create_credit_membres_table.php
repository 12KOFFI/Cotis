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
        Schema::create('credit_membres', function (Blueprint $table) {
            $table->id();
            $table->foreignId('groupe_id')->constrained()->cascadeOnDelete();
            $table->foreignId('membre_id')->constrained()->cascadeOnDelete();
            $table->bigInteger('montant');
            $table->foreignId('periode_source_id')->nullable()->constrained('periodes')->nullOnDelete();
            $table->foreignId('periode_appliquee_id')->nullable()->constrained('periodes')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('credit_membres');
    }
};

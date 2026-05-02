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
        Schema::create('invitations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('groupe_id')->constrained()->cascadeOnDelete();
            $table->foreignId('membre_id')->nullable()->constrained()->nullOnDelete();
            $table->string('token', 64)->unique();
            $table->string('telephone')->nullable();
            $table->string('email')->nullable();
            $table->enum('canal', ['sms', 'whatsapp', 'email', 'lien'])->default('sms');
            $table->enum('statut', ['envoyee', 'acceptee', 'expiree'])->default('envoyee');
            $table->timestamp('expire_at')->nullable();
            $table->timestamp('acceptee_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('invitations');
    }
};

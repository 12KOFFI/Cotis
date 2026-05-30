<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('group_invite_links', function (Blueprint $table) {
            $table->string('target_name', 120)->nullable()->after('max_uses');
            $table->string('target_prenom', 120)->nullable()->after('target_name');
            $table->unsignedBigInteger('montant_perso')->nullable()->after('target_prenom');
        });
    }

    public function down(): void
    {
        Schema::table('group_invite_links', function (Blueprint $table) {
            $table->dropColumn(['target_name', 'target_prenom', 'montant_perso']);
        });
    }
};

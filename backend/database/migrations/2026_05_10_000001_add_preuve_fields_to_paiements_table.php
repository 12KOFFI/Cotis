<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('paiements', function (Blueprint $table) {
            $table->string('preuve_path')->nullable()->after('transaction_id');
            $table->foreignId('valide_par')->nullable()->constrained('users')->nullOnDelete()->after('enregistre_par');
            $table->timestamp('valide_at')->nullable()->after('valide_par');
        });
    }

    public function down(): void
    {
        Schema::table('paiements', function (Blueprint $table) {
            $table->dropColumn(['preuve_path', 'valide_par', 'valide_at']);
        });
    }
};

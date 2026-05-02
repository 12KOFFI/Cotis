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
        Schema::table('users', function (Blueprint $table) {
            $table->string('telephone')->nullable()->after('email');
            $table->enum('role', ['super_admin', 'gestionnaire', 'membre'])->default('gestionnaire')->after('telephone');
            $table->string('magic_link_token', 64)->nullable()->unique()->after('password');
            $table->timestamp('magic_link_expires_at')->nullable()->after('magic_link_token');
            $table->string('otp_code', 10)->nullable()->after('magic_link_expires_at');
            $table->timestamp('otp_expires_at')->nullable()->after('otp_code');
            $table->string('avatar')->nullable()->after('otp_expires_at');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['telephone','role','magic_link_token','magic_link_expires_at','otp_code','otp_expires_at','avatar']);
        });
    }
};

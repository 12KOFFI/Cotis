<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('group_invite_links', function (Blueprint $table) {
            $table->id();
            $table->foreignId('groupe_id')->constrained()->cascadeOnDelete();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->string('token', 80)->unique();
            $table->timestamp('expires_at')->nullable();
            $table->boolean('active')->default(true);
            $table->unsignedInteger('uses_count')->default(0);
            $table->unsignedInteger('max_uses')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('group_invite_links');
    }
};

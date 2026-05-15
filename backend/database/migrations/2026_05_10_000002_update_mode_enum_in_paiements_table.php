<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE paiements MODIFY COLUMN mode ENUM('wave','cash','virement','autre','orange_money','moov','mtn') DEFAULT 'cash'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE paiements MODIFY COLUMN mode ENUM('wave','cash','virement','autre') DEFAULT 'cash'");
    }
};

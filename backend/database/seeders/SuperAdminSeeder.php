<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SuperAdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@cotispro.com'],
            [
                'name' => 'Super Admin',
                'password' => Hash::make('admin2026'),
                'role' => 'super_admin',
                'email_verified_at' => now(),
            ]
        );
    }
}

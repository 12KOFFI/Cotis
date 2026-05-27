<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Laravel\Sanctum\HasApiTokens;

#[Fillable(['name', 'email', 'password', 'telephone', 'role', 'solde', 'magic_link_token', 'magic_link_expires_at', 'otp_code', 'otp_expires_at', 'avatar'])]
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token', 'magic_link_token', 'otp_code'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, TwoFactorAuthenticatable, HasApiTokens;

    public function groupes()
    {
        return $this->hasMany(Groupe::class, 'gestionnaire_id');
    }

    public function membres()
    {
        return $this->hasMany(Membre::class);
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
        ];
    }
}

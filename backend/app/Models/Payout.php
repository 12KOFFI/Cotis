<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Payout extends Model
{
    protected $fillable = [
        'groupe_id', 'user_id', 'amount', 'gateway_fees', 'platform_commission',
        'net_amount', 'recipient_phone', 'recipient_name', 'destination_provider',
        'wallet_id', 'idempotency_key', 'provider_reference',
        'status', 'failure_reason', 'failure_code',
    ];

    /* ---------- Relations ---------- */
    public function groupe() { return $this->belongsTo(Groupe::class); }
    public function user()   { return $this->belongsTo(User::class); }

    /* ---------- Scopes ---------- */
    public function scopePaid($q)    { return $q->where('status', 'paid'); }
    public function scopeFailed($q)  { return $q->where('status', 'failed'); }
    public function scopePending($q) { return $q->where('status', 'pending'); }
}

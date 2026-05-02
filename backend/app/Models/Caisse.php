<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Caisse extends Model
{
    protected $guarded = [];
    public function groupe() { return $this->belongsTo(Groupe::class); }
    public function ledger() { return $this->hasMany(CaisseLedger::class); }
}

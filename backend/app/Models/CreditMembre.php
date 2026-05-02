<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CreditMembre extends Model
{
    protected $guarded = [];
    public function groupe() { return $this->belongsTo(Groupe::class); }
    public function membre() { return $this->belongsTo(Membre::class); }
}

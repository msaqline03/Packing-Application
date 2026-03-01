<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Country extends Model
{
    protected $fillable = ['code', 'name', 'notes', 'contacts', 'warnings'];

    protected $casts = [
        'contacts' => 'array',
        'warnings' => 'array',
    ];
}

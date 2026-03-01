<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InternalAccount extends Model
{
    protected $table = 'internal_accounts';

    protected $fillable = ['name', 'description', 'shrink_applied', 'shrink_receival_account'];

    protected $casts = [
        'shrink_applied' => 'boolean',
        'shrink_receival_account' => 'boolean',
    ];
}

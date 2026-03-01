<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Terminal extends Model
{
    protected $fillable = ['code', 'name', 'contacts', 'notes', 'revenue_price', 'expense_price'];

    protected $casts = [
        'contacts' => 'array',
        'revenue_price' => 'decimal:2',
        'expense_price' => 'decimal:2',
    ];
}

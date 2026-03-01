<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ContainerPark extends Model
{
    protected $table = 'container_parks';

    protected $fillable = [
        'code',
        'name',
        'container_chain_name',
        'contacts',
        'notes',
        'revenue_price',
        'expense_price',
    ];

    protected $casts = [
        'contacts' => 'array',
        'revenue_price' => 'decimal:2',
        'expense_price' => 'decimal:2',
    ];
}

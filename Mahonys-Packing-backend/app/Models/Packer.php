<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Packer extends Model
{
    protected $fillable = [
        'name',
        'description',
        'status',
        'commodity_types_allowed',
        'stock_locations_allowed',
    ];

    protected $casts = [
        'commodity_types_allowed' => 'array',
        'stock_locations_allowed' => 'array',
    ];
}

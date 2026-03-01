<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StockLocation extends Model
{
    protected $table = 'stock_locations';

    protected $fillable = ['name', 'site', 'status', 'location_type', 'capacity'];

    protected $casts = [
        'site' => 'integer',
        'capacity' => 'integer',
    ];
}

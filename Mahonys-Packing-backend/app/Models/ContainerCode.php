<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ContainerCode extends Model
{
    protected $table = 'container_codes';

    protected $fillable = [
        'iso_code',
        'container_size',
        'description',
        'cubic_meters',
        'average_weight',
        'max_weight',
        'average_empty_tare',
    ];
}

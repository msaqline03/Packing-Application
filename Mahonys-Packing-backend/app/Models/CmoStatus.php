<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CmoStatus extends Model
{
    protected $table = 'cmo_statuses';

    protected $fillable = ['name', 'color'];
}

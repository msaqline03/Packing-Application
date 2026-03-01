<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FeesAndCharge extends Model
{
    protected $table = 'fees_and_charges';

    protected $fillable = [
        'charge_name',
        'charge_description',
        'charge_rate',
        'charge_type',
        'apply_to_all_packs',
        'charge_classification',
        'account_code',
    ];

    protected $casts = [
        'charge_rate' => 'decimal:2',
        'apply_to_all_packs' => 'boolean',
    ];
}

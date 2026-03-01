<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Commodity extends Model
{
    protected $fillable = [
        'commodity_type_id',
        'commodity_code',
        'description',
        'hs_code',
        'pems_code',
        'status',
        'unit_type',
        'test_thresholds',
        'shrink_amount',
    ];

    protected $casts = [
        'test_thresholds' => 'array',
    ];

    public function commodityType(): BelongsTo
    {
        return $this->belongsTo(CommodityType::class, 'commodity_type_id');
    }
}

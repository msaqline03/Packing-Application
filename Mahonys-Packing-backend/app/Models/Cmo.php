<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Cmo extends Model
{
    protected $table = 'cmos';

    protected $fillable = [
        'cmo_reference',
        'direction',
        'customer_id',
        'commodity_type_id',
        'commodity_id',
        'cmo_status_id',
        'status',
        'estimated_amount',
        'bookings',
    ];

    protected $casts = [
        'estimated_amount' => 'decimal:2',
        'bookings' => 'array',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function commodityType(): BelongsTo
    {
        return $this->belongsTo(CommodityType::class, 'commodity_type_id');
    }

    public function commodity(): BelongsTo
    {
        return $this->belongsTo(Commodity::class, 'commodity_id');
    }

    public function cmoStatus(): BelongsTo
    {
        return $this->belongsTo(CmoStatus::class, 'cmo_status_id');
    }
}

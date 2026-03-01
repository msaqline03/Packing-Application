<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Ticket extends Model
{
    protected $fillable = [
        'type',
        'status',
        'site',
        'date',
        'ticket_reference',
        'truck_id',
        'driver_name',
        'gross_weights',
        'tare_weights',
        'commodity_id',
        'cmo_id',
        'unloaded_location',
        'loading_location',
        'quality',
    ];

    protected $casts = [
        'date' => 'datetime',
        'gross_weights' => 'array',
        'tare_weights' => 'array',
        'quality' => 'array',
    ];

    public function truck(): BelongsTo
    {
        return $this->belongsTo(Truck::class);
    }

    public function commodity(): BelongsTo
    {
        return $this->belongsTo(Commodity::class);
    }

    public function cmo(): BelongsTo
    {
        return $this->belongsTo(Cmo::class, 'cmo_id');
    }

    public function unloadedLocation(): BelongsTo
    {
        return $this->belongsTo(StockLocation::class, 'unloaded_location');
    }

    public function loadingLocation(): BelongsTo
    {
        return $this->belongsTo(StockLocation::class, 'loading_location');
    }
}

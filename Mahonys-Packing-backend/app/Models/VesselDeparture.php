<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VesselDeparture extends Model
{
    protected $table = 'vessel_departures';

    protected $fillable = [
        'vessel',
        'voyage_number',
        'vessel_lloyds',
        'vessel_cutoff_date',
        'vessel_receivals_open_date',
        'vessel_eta',
        'vessel_etd',
        'vessel_free_days',
        'shipping_line_id',
    ];


    public function shippingLine(): BelongsTo
    {
        return $this->belongsTo(ShippingLine::class);
    }
}

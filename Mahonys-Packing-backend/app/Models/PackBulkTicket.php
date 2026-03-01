<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PackBulkTicket extends Model
{
    protected $table = 'pack_bulk_tickets';

    protected $fillable = [
        'pack_id',
        'date',
        'truck_id',
        'gross_weight',
        'tare_weight',
        'location_id',
        'signoff',
        'test_results',
        'notes',
        'status',
    ];

    protected $casts = [
        'date' => 'date',
        'test_results' => 'array',
    ];

    public function pack(): BelongsTo
    {
        return $this->belongsTo(Pack::class, 'pack_id');
    }

    public function truck(): BelongsTo
    {
        return $this->belongsTo(Truck::class, 'truck_id');
    }
}

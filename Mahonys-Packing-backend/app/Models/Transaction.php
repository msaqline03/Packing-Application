<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Transaction extends Model
{
    protected $fillable = [
        'transaction_date',
        'ticket_id',
        'ticket_type',
        'account_id',
        'account_type',
        'commodity_id',
        'commodity_type_id',
        'location_id',
        'site',
        'transaction_type',
        'quantity',
        'reference',
        'notes',
        'status',
        'adjustment_of',
    ];

    protected $casts = [
        'transaction_date' => 'date',
        'quantity' => 'decimal:4',
    ];

    public function commodity(): BelongsTo
    {
        return $this->belongsTo(Commodity::class, 'commodity_id');
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(StockLocation::class, 'location_id');
    }
}

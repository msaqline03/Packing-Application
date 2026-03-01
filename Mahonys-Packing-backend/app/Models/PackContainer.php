<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PackContainer extends Model
{
    protected $table = 'pack_containers';

    protected $fillable = [
        'pack_id',
        'container_number',
        'seal_number',
        'container_iso_code',
        'start_date_time',
        'stock_location_id',
        'packer_id',
        'tare',
        'container_tare',
        'gross',
        'nett',
        'release_ref',
        'empty_container_park_id',
        'transporter_id',
        'packer_signoff',
        'packer_signoff_date_time',
        'authorised_officer',
        'empty_container_inspection_result',
        'empty_container_inspection_remark',
        'grain_inspection_result',
        'grain_inspection_remark',
        'authorised_officer_signoff',
        'authorised_officer_signoff_date_time',
        'status',
    ];

    public function pack(): BelongsTo
    {
        return $this->belongsTo(Pack::class, 'pack_id');
    }

    public function stockLocation(): BelongsTo
    {
        return $this->belongsTo(StockLocation::class, 'stock_location_id');
    }

    public function packer(): BelongsTo
    {
        return $this->belongsTo(Packer::class, 'packer_id');
    }
}

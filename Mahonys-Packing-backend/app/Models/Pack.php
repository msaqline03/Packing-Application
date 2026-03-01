<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Pack extends Model
{
    protected $fillable = [
        'pack_type',
        'import_export',
        'customer_id',
        'exporter',
        'commodity_type_id',
        'commodity_id',
        'status',
        'job_reference',
        'fumigation',
        'containers_required',
        'release_ids',
        'release_details',
        'empty_container_park_ids',
        'transporter_ids',
        'assigned_packer_ids',
        'site_id',
        'quantity_per_container',
        'max_qty_per_container',
        'mt_total',
        'destination_country',
        'destination_port',
        'transshipment_port',
        'transshipment_port_code',
        'shipping_line_id',
        'vessel_departure_id',
        'import_permit_required',
        'import_permit_number',
        'import_permit_date',
        'import_permit_files',
        'rfp',
        'rfp_additional_declaration_required',
        'additional_declaration_files',
        'rfp_files',
        'rfp_comment',
        'rfp_expiry',
        'rfp_commodity_code',
        'sample_required',
        'sample_locations',
        'sample_sent_dates',
        'sample_statuses',
        'packing_instruction_files',
        'job_notes',
        'date',
        'scheduled_packer_id',
        'test_required',
        'shrink_taken',
        'verification',
    ];

    protected $casts = [
        'release_ids' => 'array',
        'release_details' => 'array',
        'empty_container_park_ids' => 'array',
        'transporter_ids' => 'array',
        'assigned_packer_ids' => 'array',
        'import_permit_files' => 'array',
        'additional_declaration_files' => 'array',
        'rfp_files' => 'array',
        'sample_locations' => 'array',
        'sample_sent_dates' => 'array',
        'sample_statuses' => 'array',
        'packing_instruction_files' => 'array',
        'verification' => 'array',
        'date' => 'date',
        'import_permit_required' => 'boolean',
        'rfp_additional_declaration_required' => 'boolean',
        'sample_required' => 'boolean',
        'test_required' => 'boolean',
        'shrink_taken' => 'boolean',
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

    public function shippingLine(): BelongsTo
    {
        return $this->belongsTo(ShippingLine::class);
    }

    public function vesselDeparture(): BelongsTo
    {
        return $this->belongsTo(VesselDeparture::class, 'vessel_departure_id');
    }

    public function packContainers(): HasMany
    {
        return $this->hasMany(PackContainer::class, 'pack_id');
    }

    public function packBulkTickets(): HasMany
    {
        return $this->hasMany(PackBulkTicket::class, 'pack_id');
    }
}

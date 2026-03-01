<?php

namespace App\Http\Controllers\Api;

use App\Models\Pack;
use App\Models\PackContainer;
use App\Models\PackBulkTicket;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PackController extends BaseController
{
    public function index(Request $request): JsonResponse
    {
        $query = Pack::with(['customer', 'commodityType', 'commodity', 'shippingLine', 'vesselDeparture', 'packContainers', 'packBulkTickets']);
        if ($request->has('pack_type')) {
            $query->where('pack_type', $request->pack_type);
        }
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        return $this->success($query->orderByDesc('date')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'pack_type' => 'required|in:container,bulk',
            'import_export' => 'nullable|string|in:Import,Export',
            'customer_id' => 'required|exists:customers,id',
            'exporter' => 'nullable|string',
            'commodity_type_id' => 'required|exists:commodity_types,id',
            'commodity_id' => 'required|exists:commodities,id',
            'status' => 'nullable|string',
            'job_reference' => 'nullable|string',
            'fumigation' => 'nullable|string',
            'containers_required' => 'nullable|integer',
            'release_ids' => 'nullable|array',
            'release_details' => 'nullable|array',
            'empty_container_park_ids' => 'nullable|array',
            'transporter_ids' => 'nullable|array',
            'assigned_packer_ids' => 'nullable|array',
            'site_id' => 'nullable|integer',
            'quantity_per_container' => 'nullable|numeric',
            'max_qty_per_container' => 'nullable|numeric',
            'mt_total' => 'nullable|numeric',
            'destination_country' => 'nullable|string',
            'destination_port' => 'nullable|string',
            'transshipment_port' => 'nullable|string',
            'transshipment_port_code' => 'nullable|string',
            'shipping_line_id' => 'nullable|exists:shipping_lines,id',
            'vessel_departure_id' => 'nullable|exists:vessel_departures,id',
            'import_permit_required' => 'nullable|boolean',
            'import_permit_number' => 'nullable|string',
            'import_permit_date' => 'nullable|date',
            'import_permit_files' => 'nullable|array',
            'rfp' => 'nullable|string',
            'rfp_additional_declaration_required' => 'nullable|boolean',
            'additional_declaration_files' => 'nullable|array',
            'rfp_files' => 'nullable|array',
            'rfp_comment' => 'nullable|string',
            'rfp_expiry' => 'nullable|date',
            'rfp_commodity_code' => 'nullable|string',
            'sample_required' => 'nullable|boolean',
            'sample_locations' => 'nullable|array',
            'sample_sent_dates' => 'nullable|array',
            'sample_statuses' => 'nullable|array',
            'packing_instruction_files' => 'nullable|array',
            'job_notes' => 'nullable|string',
            'date' => 'nullable|date',
            'scheduled_packer_id' => 'nullable|exists:packers,id',
            'test_required' => 'nullable|boolean',
            'shrink_taken' => 'nullable|boolean',
            'verification' => 'nullable|array',
        ]);
        $pack = Pack::create($validated);
        return $this->created($pack->load(['customer', 'commodityType', 'commodity', 'shippingLine', 'vesselDeparture']));
    }

    public function show(Pack $pack): JsonResponse
    {
        $pack->load(['customer', 'commodityType', 'commodity', 'shippingLine', 'vesselDeparture', 'packContainers.stockLocation', 'packContainers.packer', 'packBulkTickets.truck']);
        $data = $pack->toArray();
        $data['containers'] = $pack->packContainers->toArray();
        $data['bulk_tickets'] = $pack->packBulkTickets->toArray();
        unset($data['pack_containers'], $data['pack_bulk_tickets']);
        return $this->success($data);
    }

    public function update(Request $request, Pack $pack): JsonResponse
    {
        $pack->update($request->all());
        $pack->load(['customer', 'commodityType', 'commodity', 'shippingLine', 'vesselDeparture', 'packContainers', 'packBulkTickets']);
        $data = $pack->toArray();
        $data['containers'] = $pack->packContainers->toArray();
        $data['bulk_tickets'] = $pack->packBulkTickets->toArray();
        unset($data['pack_containers'], $data['pack_bulk_tickets']);
        return $this->success($data);
    }

    public function destroy(Pack $pack): JsonResponse
    {
        $pack->delete();
        return $this->success(null, 204);
    }

    public function addContainer(Request $request, Pack $pack): JsonResponse
    {
        $validated = $request->validate([
            'container_number' => 'nullable|string',
            'seal_number' => 'nullable|string',
            'container_iso_code' => 'nullable|string',
            'start_date_time' => 'nullable|string',
            'stock_location_id' => 'nullable|exists:stock_locations,id',
            'packer_id' => 'nullable|exists:packers,id',
            'tare' => 'nullable|integer',
            'container_tare' => 'nullable|integer',
            'gross' => 'nullable|integer',
            'nett' => 'nullable|integer',
            'release_ref' => 'nullable|string',
            'empty_container_park_id' => 'nullable|exists:container_parks,id',
            'transporter_id' => 'nullable|exists:transporters,id',
            'status' => 'nullable|string',
        ]);
        $container = $pack->packContainers()->create($validated);
        return $this->created($container);
    }

    public function updateContainer(Request $request, Pack $pack, PackContainer $container): JsonResponse
    {
        if ($container->pack_id !== $pack->id) {
            return $this->notFound('Container not in this pack');
        }
        $container->update($request->only([
            'container_number', 'seal_number', 'container_iso_code', 'start_date_time',
            'stock_location_id', 'packer_id', 'tare', 'container_tare', 'gross', 'nett',
            'release_ref', 'empty_container_park_id', 'transporter_id', 'status',
            'packer_signoff', 'packer_signoff_date_time', 'authorised_officer',
            'empty_container_inspection_result', 'empty_container_inspection_remark',
            'grain_inspection_result', 'grain_inspection_remark',
            'authorised_officer_signoff', 'authorised_officer_signoff_date_time',
        ]));
        return $this->success($container->fresh());
    }

    public function deleteContainer(Pack $pack, PackContainer $container): JsonResponse
    {
        if ($container->pack_id !== $pack->id) {
            return $this->notFound('Container not in this pack');
        }
        $container->delete();
        return $this->success(null, 204);
    }

    public function addBulkTicket(Request $request, Pack $pack): JsonResponse
    {
        $validated = $request->validate([
            'date' => 'nullable|date',
            'truck_id' => 'nullable|exists:trucks,id',
            'gross_weight' => 'nullable|integer',
            'tare_weight' => 'nullable|integer',
            'location_id' => 'nullable|exists:stock_locations,id',
            'signoff' => 'nullable|string',
            'test_results' => 'nullable|array',
            'notes' => 'nullable|string',
            'status' => 'nullable|string',
        ]);
        $bulkTicket = $pack->packBulkTickets()->create($validated);
        return $this->created($bulkTicket);
    }

    public function updateBulkTicket(Request $request, Pack $pack, PackBulkTicket $bulkTicket): JsonResponse
    {
        if ($bulkTicket->pack_id !== $pack->id) {
            return $this->notFound('Bulk ticket not in this pack');
        }
        $bulkTicket->update($request->only(['date', 'truck_id', 'gross_weight', 'tare_weight', 'location_id', 'signoff', 'test_results', 'notes', 'status']));
        return $this->success($bulkTicket->fresh());
    }

    public function deleteBulkTicket(Pack $pack, PackBulkTicket $bulkTicket): JsonResponse
    {
        if ($bulkTicket->pack_id !== $pack->id) {
            return $this->notFound('Bulk ticket not in this pack');
        }
        $bulkTicket->delete();
        return $this->success(null, 204);
    }
}

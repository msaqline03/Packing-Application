<?php

namespace App\Http\Controllers\Api;

use App\Models\VesselDeparture;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VesselDepartureController extends BaseController
{
    public function index(): JsonResponse { return $this->success(VesselDeparture::with('shippingLine')->orderBy('vessel_eta')->get()); }
    public function store(Request $request): JsonResponse { return $this->created(VesselDeparture::create($request->validate(['vessel' => 'nullable|string', 'voyage_number' => 'nullable|string', 'vessel_lloyds' => 'nullable|string', 'vessel_cutoff_date' => 'nullable|date', 'vessel_receivals_open_date' => 'nullable|date', 'vessel_eta' => 'nullable|string', 'vessel_etd' => 'nullable|string', 'vessel_free_days' => 'nullable|integer', 'shipping_line_id' => 'nullable|exists:shipping_lines,id']))); }
    public function show(VesselDeparture $vesselDeparture): JsonResponse { return $this->success($vesselDeparture->load('shippingLine')); }
    public function update(Request $request, VesselDeparture $vesselDeparture): JsonResponse { $vesselDeparture->update($request->only(['vessel', 'voyage_number', 'vessel_lloyds', 'vessel_cutoff_date', 'vessel_receivals_open_date', 'vessel_eta', 'vessel_etd', 'vessel_free_days', 'shipping_line_id'])); return $this->success($vesselDeparture); }
    public function destroy(VesselDeparture $vesselDeparture): JsonResponse { $vesselDeparture->delete(); return $this->success(null, 204); }
}

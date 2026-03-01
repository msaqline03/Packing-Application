<?php

namespace App\Http\Controllers\Api;

use App\Models\StockLocation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StockLocationController extends BaseController
{
    public function index(): JsonResponse { return $this->success(StockLocation::orderBy('site')->orderBy('name')->get()); }
    public function store(Request $request): JsonResponse { return $this->created(StockLocation::create($request->validate(['name' => 'required|string', 'site' => 'nullable|integer', 'status' => 'nullable|string', 'location_type' => 'nullable|string', 'capacity' => 'nullable|integer']))); }
    public function show(StockLocation $stockLocation): JsonResponse { return $this->success($stockLocation); }
    public function update(Request $request, StockLocation $stockLocation): JsonResponse { $stockLocation->update($request->only(['name', 'site', 'status', 'location_type', 'capacity'])); return $this->success($stockLocation); }
    public function destroy(StockLocation $stockLocation): JsonResponse { $stockLocation->delete(); return $this->success(null, 204); }
}

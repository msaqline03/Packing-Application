<?php

namespace App\Http\Controllers\Api;

use App\Models\Truck;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TruckController extends BaseController
{
    public function index(): JsonResponse { return $this->success(Truck::all()); }
    public function store(Request $request): JsonResponse { return $this->created(Truck::create($request->validate(['name' => 'nullable|string', 'driver' => 'nullable|string', 'tare' => 'nullable|integer']))); }
    public function show(Truck $truck): JsonResponse { return $this->success($truck); }
    public function update(Request $request, Truck $truck): JsonResponse { $truck->update($request->only(['name', 'driver', 'tare'])); return $this->success($truck); }
    public function destroy(Truck $truck): JsonResponse { $truck->delete(); return $this->success(null, 204); }
}

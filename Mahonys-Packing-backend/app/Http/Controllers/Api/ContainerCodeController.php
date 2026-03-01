<?php

namespace App\Http\Controllers\Api;

use App\Models\ContainerCode;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ContainerCodeController extends BaseController
{
    public function index(): JsonResponse { return $this->success(ContainerCode::all()); }
    public function store(Request $request): JsonResponse { return $this->created(ContainerCode::create($request->validate(['iso_code' => 'nullable|string', 'container_size' => 'nullable|string', 'description' => 'nullable|string', 'cubic_meters' => 'nullable|numeric', 'average_weight' => 'nullable|integer', 'max_weight' => 'nullable|integer', 'average_empty_tare' => 'nullable|integer']))); }
    public function show(ContainerCode $containerCode): JsonResponse { return $this->success($containerCode); }
    public function update(Request $request, ContainerCode $containerCode): JsonResponse { $containerCode->update($request->only(['iso_code', 'container_size', 'description', 'cubic_meters', 'average_weight', 'max_weight', 'average_empty_tare'])); return $this->success($containerCode); }
    public function destroy(ContainerCode $containerCode): JsonResponse { $containerCode->delete(); return $this->success(null, 204); }
}

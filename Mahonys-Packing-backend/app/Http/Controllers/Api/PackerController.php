<?php

namespace App\Http\Controllers\Api;

use App\Models\Packer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PackerController extends BaseController
{
    public function index(): JsonResponse { return $this->success(Packer::orderBy('name')->get()); }
    public function store(Request $request): JsonResponse { return $this->created(Packer::create($request->validate(['name' => 'required|string', 'description' => 'nullable|string', 'status' => 'nullable|string', 'commodity_types_allowed' => 'nullable|array', 'stock_locations_allowed' => 'nullable|array']))); }
    public function show(Packer $packer): JsonResponse { return $this->success($packer); }
    public function update(Request $request, Packer $packer): JsonResponse { $packer->update($request->only(['name', 'description', 'status', 'commodity_types_allowed', 'stock_locations_allowed'])); return $this->success($packer); }
    public function destroy(Packer $packer): JsonResponse { $packer->delete(); return $this->success(null, 204); }
}

<?php

namespace App\Http\Controllers\Api;

use App\Models\ContainerPark;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ContainerParkController extends BaseController
{
    public function index(): JsonResponse { return $this->success(ContainerPark::orderBy('name')->get()); }
    public function store(Request $request): JsonResponse { return $this->created(ContainerPark::create($request->validate(['code' => 'nullable|string', 'name' => 'required|string', 'container_chain_name' => 'nullable|string', 'contacts' => 'nullable|array', 'notes' => 'nullable|string', 'revenue_price' => 'nullable|numeric', 'expense_price' => 'nullable|numeric']))); }
    public function show(ContainerPark $containerPark): JsonResponse { return $this->success($containerPark); }
    public function update(Request $request, ContainerPark $containerPark): JsonResponse { $containerPark->update($request->only(['code', 'name', 'container_chain_name', 'contacts', 'notes', 'revenue_price', 'expense_price'])); return $this->success($containerPark); }
    public function destroy(ContainerPark $containerPark): JsonResponse { $containerPark->delete(); return $this->success(null, 204); }
}

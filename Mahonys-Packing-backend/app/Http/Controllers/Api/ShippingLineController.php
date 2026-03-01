<?php

namespace App\Http\Controllers\Api;

use App\Models\ShippingLine;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ShippingLineController extends BaseController
{
    public function index(): JsonResponse { return $this->success(ShippingLine::orderBy('name')->get()); }
    public function store(Request $request): JsonResponse { return $this->created(ShippingLine::create($request->validate(['code' => 'nullable|string', 'name' => 'required|string', 'website' => 'nullable|string', 'email' => 'nullable|string', 'phone' => 'nullable|string']))); }
    public function show(ShippingLine $shippingLine): JsonResponse { return $this->success($shippingLine); }
    public function update(Request $request, ShippingLine $shippingLine): JsonResponse { $shippingLine->update($request->only(['code', 'name', 'website', 'email', 'phone'])); return $this->success($shippingLine); }
    public function destroy(ShippingLine $shippingLine): JsonResponse { $shippingLine->delete(); return $this->success(null, 204); }
}

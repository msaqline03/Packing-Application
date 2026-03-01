<?php

namespace App\Http\Controllers\Api;

use App\Models\FeesAndCharge;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FeesAndChargeController extends BaseController
{
    public function index(): JsonResponse { return $this->success(FeesAndCharge::all()); }
    public function store(Request $request): JsonResponse { return $this->created(FeesAndCharge::create($request->validate(['charge_name' => 'required|string', 'charge_description' => 'nullable|string', 'charge_rate' => 'nullable|numeric', 'charge_type' => 'nullable|string', 'apply_to_all_packs' => 'nullable|boolean', 'charge_classification' => 'nullable|string', 'account_code' => 'nullable|string']))); }
    public function show(FeesAndCharge $feesAndCharge): JsonResponse { return $this->success($feesAndCharge); }
    public function update(Request $request, FeesAndCharge $feesAndCharge): JsonResponse { $feesAndCharge->update($request->only(['charge_name', 'charge_description', 'charge_rate', 'charge_type', 'apply_to_all_packs', 'charge_classification', 'account_code'])); return $this->success($feesAndCharge); }
    public function destroy(FeesAndCharge $feesAndCharge): JsonResponse { $feesAndCharge->delete(); return $this->success(null, 204); }
}

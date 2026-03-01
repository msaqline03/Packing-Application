<?php

namespace App\Http\Controllers\Api;

use App\Models\Commodity;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CommodityController extends BaseController
{
    public function index(): JsonResponse
    {
        return $this->success(Commodity::with('commodityType')->orderBy('commodity_code')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'commodity_type_id' => 'required|exists:commodity_types,id',
            'commodity_code' => 'nullable|string|max:50',
            'description' => 'nullable|string|max:255',
            'hs_code' => 'nullable|string|max:50',
            'pems_code' => 'nullable|string|max:50',
            'status' => 'nullable|string|max:20',
            'unit_type' => 'nullable|string|max:10',
            'test_thresholds' => 'nullable|array',
            'shrink_amount' => 'nullable|string|max:20',
        ]);
        return $this->created(Commodity::create($validated));
    }

    public function show(Commodity $commodity): JsonResponse
    {
        return $this->success($commodity->load('commodityType'));
    }

    public function update(Request $request, Commodity $commodity): JsonResponse
    {
        $commodity->update($request->validate([
            'commodity_type_id' => 'sometimes|exists:commodity_types,id',
            'commodity_code' => 'nullable|string|max:50',
            'description' => 'nullable|string|max:255',
            'hs_code' => 'nullable|string|max:50',
            'pems_code' => 'nullable|string|max:50',
            'status' => 'nullable|string|max:20',
            'unit_type' => 'nullable|string|max:10',
            'test_thresholds' => 'nullable|array',
            'shrink_amount' => 'nullable|string|max:20',
        ]));
        return $this->success($commodity);
    }

    public function destroy(Commodity $commodity): JsonResponse
    {
        $commodity->delete();
        return $this->success(null, 204);
    }
}

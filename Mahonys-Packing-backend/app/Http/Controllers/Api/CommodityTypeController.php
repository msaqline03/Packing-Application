<?php

namespace App\Http\Controllers\Api;

use App\Models\CommodityType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CommodityTypeController extends BaseController
{
    public function index(): JsonResponse
    {
        return $this->success(CommodityType::with('commodities')->orderBy('name')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'acos_code' => 'nullable|string|max:50',
            'test_required' => 'nullable|string|max:10',
            'shrink_percent' => 'nullable|string|max:20',
        ]);
        return $this->created(CommodityType::create($validated));
    }

    public function show(CommodityType $commodityType): JsonResponse
    {
        return $this->success($commodityType->load('commodities'));
    }

    public function update(Request $request, CommodityType $commodityType): JsonResponse
    {
        $commodityType->update($request->validate([
            'name' => 'sometimes|string|max:255',
            'acos_code' => 'nullable|string|max:50',
            'test_required' => 'nullable|string|max:10',
            'shrink_percent' => 'nullable|string|max:20',
        ]));
        return $this->success($commodityType);
    }

    public function destroy(CommodityType $commodityType): JsonResponse
    {
        $commodityType->delete();
        return $this->success(null, 204);
    }
}

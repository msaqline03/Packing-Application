<?php

namespace App\Http\Controllers\Api;

use App\Models\CmoStatus;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CmoStatusController extends BaseController
{
    public function index(): JsonResponse { return $this->success(CmoStatus::orderBy('name')->get()); }
    public function store(Request $request): JsonResponse { return $this->created(CmoStatus::create($request->validate(['name' => 'required|string', 'color' => 'nullable|string']))); }
    public function show(CmoStatus $cmoStatus): JsonResponse { return $this->success($cmoStatus); }
    public function update(Request $request, CmoStatus $cmoStatus): JsonResponse { $cmoStatus->update($request->only(['name', 'color'])); return $this->success($cmoStatus); }
    public function destroy(CmoStatus $cmoStatus): JsonResponse { $cmoStatus->delete(); return $this->success(null, 204); }
}

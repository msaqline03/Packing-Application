<?php

namespace App\Http\Controllers\Api;

use App\Models\Test;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TestController extends BaseController
{
    public function index(): JsonResponse { return $this->success(Test::orderBy('name')->get()); }
    public function store(Request $request): JsonResponse { return $this->created(Test::create($request->validate(['name' => 'required|string', 'type' => 'nullable|string', 'unit' => 'nullable|string', 'status' => 'nullable|string', 'description' => 'nullable|string']))); }
    public function show(Test $test): JsonResponse { return $this->success($test); }
    public function update(Request $request, Test $test): JsonResponse { $test->update($request->only(['name', 'type', 'unit', 'status', 'description'])); return $this->success($test); }
    public function destroy(Test $test): JsonResponse { $test->delete(); return $this->success(null, 204); }
}

<?php

namespace App\Http\Controllers\Api;

use App\Models\Transporter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TransporterController extends BaseController
{
    public function index(): JsonResponse { return $this->success(Transporter::orderBy('name')->get()); }
    public function store(Request $request): JsonResponse { return $this->created(Transporter::create($request->validate(['code' => 'nullable|string', 'name' => 'required|string']))); }
    public function show(Transporter $transporter): JsonResponse { return $this->success($transporter); }
    public function update(Request $request, Transporter $transporter): JsonResponse { $transporter->update($request->only(['code', 'name'])); return $this->success($transporter); }
    public function destroy(Transporter $transporter): JsonResponse { $transporter->delete(); return $this->success(null, 204); }
}

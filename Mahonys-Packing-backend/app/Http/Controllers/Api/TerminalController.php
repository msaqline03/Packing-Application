<?php

namespace App\Http\Controllers\Api;

use App\Models\Terminal;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TerminalController extends BaseController
{
    public function index(): JsonResponse { return $this->success(Terminal::orderBy('name')->get()); }
    public function store(Request $request): JsonResponse { return $this->created(Terminal::create($request->validate(['code' => 'nullable|string', 'name' => 'required|string', 'contacts' => 'nullable|array', 'notes' => 'nullable|string', 'revenue_price' => 'nullable|numeric', 'expense_price' => 'nullable|numeric']))); }
    public function show(Terminal $terminal): JsonResponse { return $this->success($terminal); }
    public function update(Request $request, Terminal $terminal): JsonResponse { $terminal->update($request->only(['code', 'name', 'contacts', 'notes', 'revenue_price', 'expense_price'])); return $this->success($terminal); }
    public function destroy(Terminal $terminal): JsonResponse { $terminal->delete(); return $this->success(null, 204); }
}

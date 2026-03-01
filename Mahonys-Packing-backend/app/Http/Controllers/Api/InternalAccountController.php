<?php

namespace App\Http\Controllers\Api;

use App\Models\InternalAccount;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InternalAccountController extends BaseController
{
    public function index(): JsonResponse
    {
        return $this->success(InternalAccount::orderBy('name')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'shrink_applied' => 'nullable|boolean',
            'shrink_receival_account' => 'nullable|boolean',
        ]);
        if (!empty($validated['shrink_receival_account'])) {
            InternalAccount::query()->update(['shrink_receival_account' => false]);
        }
        $account = InternalAccount::create(array_merge(
            ['shrink_applied' => false, 'shrink_receival_account' => false],
            $validated
        ));
        return $this->created($account);
    }

    public function show(InternalAccount $internalAccount): JsonResponse
    {
        return $this->success($internalAccount);
    }

    public function update(Request $request, InternalAccount $internalAccount): JsonResponse
    {
        $data = $request->only(['name', 'description', 'shrink_applied', 'shrink_receival_account']);
        if (!empty($data['shrink_receival_account'])) {
            InternalAccount::where('id', '!=', $internalAccount->id)->update(['shrink_receival_account' => false]);
        }
        $internalAccount->update($data);
        return $this->success($internalAccount);
    }

    public function destroy(InternalAccount $internalAccount): JsonResponse
    {
        $internalAccount->delete();
        return $this->success(null, 204);
    }
}

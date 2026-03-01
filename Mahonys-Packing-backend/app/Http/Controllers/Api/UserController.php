<?php

namespace App\Http\Controllers\Api;

use App\Models\User;
use App\Models\UserPermission;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends BaseController
{
    public function index(): JsonResponse
    {
        return $this->success(User::all());
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'nullable|string|min:8',
            'status' => 'nullable|string|max:20',
        ]);
        if (!empty($validated['password'])) {
            $validated['password'] = bcrypt($validated['password']);
        } else {
            unset($validated['password']);
        }
        return $this->created(User::create($validated));
    }

    public function show(User $user): JsonResponse
    {
        return $this->success($user);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $user->id,
            'password' => 'nullable|string|min:8',
            'status' => 'nullable|string|max:20',
        ]);
        if (!empty($validated['password'] ?? null)) {
            $validated['password'] = bcrypt($validated['password']);
        } else {
            unset($validated['password']);
        }
        $user->update($validated);
        return $this->success($user->fresh());
    }

    public function destroy(User $user): JsonResponse
    {
        $user->userPermissions()->delete();
        $user->delete();
        return $this->success(null, 204);
    }

    public function permissions(User $user): JsonResponse
    {
        $up = UserPermission::where('user_id', $user->id)->first();
        return $this->success(['permissions' => $up ? $up->permissions : []]);
    }

    public function updatePermissions(Request $request, User $user): JsonResponse
    {
        $request->validate(['permissions' => 'required|array', 'permissions.*' => 'string']);
        UserPermission::updateOrCreate(
            ['user_id' => $user->id],
            ['permissions' => $request->permissions]
        );
        return $this->success(['permissions' => $request->permissions]);
    }
}

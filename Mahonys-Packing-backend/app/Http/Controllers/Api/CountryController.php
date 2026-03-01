<?php

namespace App\Http\Controllers\Api;

use App\Models\Country;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CountryController extends BaseController
{
    public function index(): JsonResponse
    {
        return $this->success(Country::orderBy('name')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => 'nullable|string|max:10',
            'name' => 'required|string|max:255',
            'notes' => 'nullable|string',
            'contacts' => 'nullable|array',
            'contacts.*.contactName' => 'nullable|string|max:255',
            'contacts.*.contactPhone' => 'nullable|string|max:100',
            'contacts.*.contactEmail' => 'nullable|string|max:255',
            'warnings' => 'nullable|array',
            'warnings.*.warningDescription' => 'nullable|string',
            'warnings.*.showOnPacks' => 'nullable|boolean',
        ]);
        return $this->created(Country::create($validated));
    }

    public function show(Country $country): JsonResponse
    {
        return $this->success($country);
    }

    public function update(Request $request, Country $country): JsonResponse
    {
        $validated = $request->validate([
            'code' => 'nullable|string|max:10',
            'name' => 'sometimes|string|max:255',
            'notes' => 'nullable|string',
            'contacts' => 'nullable|array',
            'contacts.*.contactName' => 'nullable|string|max:255',
            'contacts.*.contactPhone' => 'nullable|string|max:100',
            'contacts.*.contactEmail' => 'nullable|string|max:255',
            'warnings' => 'nullable|array',
            'warnings.*.warningDescription' => 'nullable|string',
            'warnings.*.showOnPacks' => 'nullable|boolean',
        ]);
        $country->update($validated);
        return $this->success($country);
    }

    public function destroy(Country $country): JsonResponse
    {
        $country->delete();
        return $this->success(null, 204);
    }
}

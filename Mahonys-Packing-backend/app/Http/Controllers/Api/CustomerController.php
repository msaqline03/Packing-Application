<?php

namespace App\Http\Controllers\Api;

use App\Models\Customer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerController extends BaseController
{
    public function index(): JsonResponse
    {
        $items = Customer::orderBy('name')->get();
        return $this->success($items);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => 'nullable|string|max:50',
            'name' => 'required|string|max:255',
            'emails' => 'nullable|array',
            'emails.*' => 'string',
            'contacts' => 'nullable|array',
            'addresses' => 'nullable|array',
            'website' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'invoicing_contact' => 'nullable|string|max:255',
            'warnings' => 'nullable|array',
            'warnings.*.warningDescription' => 'nullable|string',
            'warnings.*.showOnPacks' => 'nullable|boolean',
        ]);
        $customer = Customer::create($validated);
        return $this->created($customer);
    }

    public function show(Customer $customer): JsonResponse
    {
        return $this->success($customer);
    }

    public function update(Request $request, Customer $customer): JsonResponse
    {
        $validated = $request->validate([
            'code' => 'nullable|string|max:50',
            'name' => 'sometimes|string|max:255',
            'emails' => 'nullable|array',
            'contacts' => 'nullable|array',
            'addresses' => 'nullable|array',
            'website' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'invoicing_contact' => 'nullable|string|max:255',
            'warnings' => 'nullable|array',
            'warnings.*.warningDescription' => 'nullable|string',
            'warnings.*.showOnPacks' => 'nullable|boolean',
        ]);
        $customer->update($validated);
        return $this->success($customer);
    }

    public function destroy(Customer $customer): JsonResponse
    {
        $customer->delete();
        return $this->success(null, 204);
    }
}

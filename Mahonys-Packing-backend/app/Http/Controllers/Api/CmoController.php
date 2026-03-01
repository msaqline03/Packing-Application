<?php

namespace App\Http\Controllers\Api;

use App\Models\Cmo;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CmoController extends BaseController
{
    public function index(): JsonResponse
    {
        return $this->success(Cmo::with(['customer', 'commodityType', 'commodity', 'cmoStatus'])->orderBy('cmo_reference')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'cmo_reference' => 'nullable|string|max:50',
            'direction' => 'required|in:in,out',
            'customer_id' => 'required|exists:customers,id',
            'commodity_type_id' => 'required|exists:commodity_types,id',
            'commodity_id' => 'required|exists:commodities,id',
            'cmo_status_id' => 'nullable|exists:cmo_statuses,id',
            'status' => 'nullable|string|max:50',
            'estimated_amount' => 'nullable|numeric',
            'bookings' => 'nullable|array',
        ]);
        if (empty($validated['bookings'])) {
            $validated['bookings'] = [];
        }
        $cmo = Cmo::create($validated);
        return $this->created($cmo->load(['customer', 'commodityType', 'commodity', 'cmoStatus']));
    }

    public function show(Cmo $cmo): JsonResponse
    {
        return $this->success($cmo->load(['customer', 'commodityType', 'commodity', 'cmoStatus']));
    }

    public function update(Request $request, Cmo $cmo): JsonResponse
    {
        $cmo->update($request->validate([
            'cmo_reference' => 'nullable|string|max:50',
            'direction' => 'sometimes|in:in,out',
            'customer_id' => 'sometimes|exists:customers,id',
            'commodity_type_id' => 'sometimes|exists:commodity_types,id',
            'commodity_id' => 'sometimes|exists:commodities,id',
            'cmo_status_id' => 'nullable|exists:cmo_statuses,id',
            'status' => 'nullable|string|max:50',
            'estimated_amount' => 'nullable|numeric',
            'bookings' => 'nullable|array',
        ]));
        return $this->success($cmo->fresh(['customer', 'commodityType', 'commodity', 'cmoStatus']));
    }

    public function destroy(Cmo $cmo): JsonResponse
    {
        $cmo->delete();
        return $this->success(null, 204);
    }

    public function addBooking(Request $request, Cmo $cmo): JsonResponse
    {
        $bookings = $cmo->bookings ?? [];
        $bookings[] = array_merge($request->validate(['booking_reference' => 'nullable|string', 'amount' => 'nullable|numeric', 'notes' => 'nullable|string']), ['id' => uniqid('', true)]);
        $cmo->update(['bookings' => $bookings]);
        return $this->created($cmo->fresh());
    }

    public function updateBooking(Request $request, Cmo $cmo, string $booking): JsonResponse
    {
        $bookings = collect($cmo->bookings ?? [])->map(function ($b) use ($booking, $request) {
            if (($b['id'] ?? '') === $booking) {
                return array_merge($b, $request->only(['booking_reference', 'amount', 'notes']));
            }
            return $b;
        })->all();
        $cmo->update(['bookings' => $bookings]);
        return $this->success($cmo->fresh());
    }

    public function deleteBooking(Cmo $cmo, string $booking): JsonResponse
    {
        $bookings = collect($cmo->bookings ?? [])->reject(fn ($b) => ($b['id'] ?? '') === $booking)->values()->all();
        $cmo->update(['bookings' => $bookings]);
        return $this->success($cmo->fresh(), 204);
    }
}

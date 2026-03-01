<?php

namespace App\Http\Controllers\Api;

use App\Models\Ticket;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TicketController extends BaseController
{
    public function index(Request $request): JsonResponse
    {
        $query = Ticket::with(['truck', 'commodity', 'cmo', 'unloadedLocation', 'loadingLocation']);
        if ($request->has('type')) {
            $query->where('type', $request->type);
        }
        if ($request->has('site')) {
            $query->where('site', $request->site);
        }
        if ($request->has('status')) {
            $query->whereIn('status', is_array($request->status) ? $request->status : [$request->status]);
        }
        return $this->success($query->orderByDesc('date')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => 'required|in:in,out',
            'status' => 'nullable|string|max:30',
            'site' => 'nullable|integer',
            'date' => 'nullable|date',
            'ticket_reference' => 'nullable|string|max:50',
            'truck_id' => 'nullable|exists:trucks,id',
            'driver_name' => 'nullable|string|max:100',
            'gross_weights' => 'nullable|array',
            'gross_weights.*' => 'numeric',
            'tare_weights' => 'nullable|array',
            'tare_weights.*' => 'numeric',
            'commodity_id' => 'nullable|exists:commodities,id',
            'cmo_id' => 'nullable|exists:cmos,id',
            'unloaded_location' => 'nullable|exists:stock_locations,id',
            'loading_location' => 'nullable|exists:stock_locations,id',
            'quality' => 'nullable|array',
        ]);
        $ticket = Ticket::create($validated);
        return $this->created($ticket->load(['truck', 'commodity', 'cmo', 'unloadedLocation', 'loadingLocation']));
    }

    public function show(Ticket $ticket): JsonResponse
    {
        return $this->success($ticket->load(['truck', 'commodity', 'cmo', 'unloadedLocation', 'loadingLocation']));
    }

    public function update(Request $request, Ticket $ticket): JsonResponse
    {
        $ticket->update($request->validate([
            'type' => 'sometimes|in:in,out',
            'status' => 'nullable|string|max:30',
            'site' => 'nullable|integer',
            'date' => 'nullable|date',
            'ticket_reference' => 'nullable|string|max:50',
            'truck_id' => 'nullable|exists:trucks,id',
            'driver_name' => 'nullable|string|max:100',
            'gross_weights' => 'nullable|array',
            'tare_weights' => 'nullable|array',
            'commodity_id' => 'nullable|exists:commodities,id',
            'cmo_id' => 'nullable|exists:cmos,id',
            'unloaded_location' => 'nullable|exists:stock_locations,id',
            'loading_location' => 'nullable|exists:stock_locations,id',
            'quality' => 'nullable|array',
        ]));
        return $this->success($ticket->fresh(['truck', 'commodity', 'cmo', 'unloadedLocation', 'loadingLocation']));
    }

    public function destroy(Ticket $ticket): JsonResponse
    {
        $ticket->delete();
        return $this->success(null, 204);
    }
}

<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SettingsController extends BaseController
{
    private function getShrinkData(): array
    {
        $row = DB::table('settings_shrink')->first();
        $default = $row ? (float) $row->default_shrink_percent : 0.5;
        $customerCommodity = DB::table('customer_commodity_shrink')->get()->map(function ($r) {
            return ['id' => $r->id, 'customer_id' => (int) $r->customer_id, 'commodity_id' => (int) $r->commodity_id, 'shrink_percent' => $r->shrink_percent];
        })->toArray();
        return ['default_shrink_percent' => $default, 'customer_commodity_shrink' => $customerCommodity];
    }

    public function shrink(): JsonResponse
    {
        return $this->success($this->getShrinkData());
    }

    public function updateShrink(Request $request): JsonResponse
    {
        $request->validate([
            'default_shrink_percent' => 'nullable|numeric',
            'customer_commodity_shrink' => 'nullable|array',
            'customer_commodity_shrink.*.customer_id' => 'required_with:customer_commodity_shrink|integer',
            'customer_commodity_shrink.*.commodity_id' => 'required_with:customer_commodity_shrink|integer',
            'customer_commodity_shrink.*.shrink_percent' => 'nullable|string',
        ]);
        $id = DB::table('settings_shrink')->value('id');
        if ($id) {
            DB::table('settings_shrink')->where('id', $id)->update(['default_shrink_percent' => $request->input('default_shrink_percent', 0.5), 'updated_at' => now()]);
        } else {
            DB::table('settings_shrink')->insert(['default_shrink_percent' => $request->input('default_shrink_percent', 0.5), 'created_at' => now(), 'updated_at' => now()]);
        }
        if ($request->has('customer_commodity_shrink')) {
            DB::table('customer_commodity_shrink')->truncate();
            foreach ($request->customer_commodity_shrink as $row) {
                DB::table('customer_commodity_shrink')->insert([
                    'customer_id' => $row['customer_id'],
                    'commodity_id' => $row['commodity_id'],
                    'shrink_percent' => $row['shrink_percent'] ?? null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
        return $this->success($this->getShrinkData());
    }

    public function packingPrices(): JsonResponse
    {
        $default = DB::table('default_packing_prices')->get()->map(fn ($r) => ['id' => $r->id, 'commodity_type_id' => (int) $r->commodity_type_id, 'container_size' => $r->container_size, 'price' => (float) $r->price])->toArray();
        $commodity = DB::table('commodity_prices')->get()->map(fn ($r) => ['id' => $r->id, 'commodity_id' => (int) $r->commodity_id, 'container_size' => $r->container_size, 'price' => (float) $r->price])->toArray();
        $typeCustomer = DB::table('commodity_type_customer_prices')->get()->map(fn ($r) => ['id' => $r->id, 'commodity_type_id' => (int) $r->commodity_type_id, 'customer_id' => (int) $r->customer_id, 'container_size' => $r->container_size, 'price' => (float) $r->price])->toArray();
        $commodityCustomer = DB::table('commodity_customer_prices')->get()->map(fn ($r) => ['id' => $r->id, 'commodity_id' => (int) $r->commodity_id, 'customer_id' => (int) $r->customer_id, 'container_size' => $r->container_size, 'price' => (float) $r->price])->toArray();
        return $this->success([
            'default_packing_prices' => $default,
            'commodity_prices' => $commodity,
            'commodity_type_customer_prices' => $typeCustomer,
            'commodity_customer_prices' => $commodityCustomer,
        ]);
    }

    public function updatePackingPrices(Request $request): JsonResponse
    {
        // Optional: implement full replace for each array; for now just return current
        return $this->packingPrices();
    }

    public function transportPrices(): JsonResponse
    {
        $items = DB::table('transporter_transport_prices')->get()->map(fn ($r) => ['id' => $r->id, 'transporter_id' => (int) $r->transporter_id, 'container_size' => $r->container_size, 'price' => (float) $r->price, 'line_item_description' => $r->line_item_description])->toArray();
        return $this->success(['transporter_transport_prices' => $items]);
    }

    public function updateTransportPrices(Request $request): JsonResponse
    {
        return $this->transportPrices();
    }
}

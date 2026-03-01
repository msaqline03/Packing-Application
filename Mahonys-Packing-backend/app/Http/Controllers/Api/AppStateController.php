<?php

namespace App\Http\Controllers\Api;

use App\Models\Country;
use App\Models\Customer;
use App\Models\CommodityType;
use App\Models\Commodity;
use App\Models\Test;
use App\Models\CmoStatus;
use App\Models\ShippingLine;
use App\Models\FeesAndCharge;
use App\Models\ContainerPark;
use App\Models\Terminal;
use App\Models\Transporter;
use App\Models\ContainerCode;
use App\Models\Packer;
use App\Models\StockLocation;
use App\Models\InternalAccount;
use App\Models\Truck;
use App\Models\VesselDeparture;
use App\Models\Cmo;
use App\Models\Ticket;
use App\Models\Pack;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Single endpoint to bootstrap the frontend app with all reference data and optional operational data.
 * GET /api/app-state?tickets=1&packs=1&transactions=1&cmos=1
 */
class AppStateController extends BaseController
{
    public function index(Request $request): JsonResponse
    {
        $data = [
            'countries' => Country::orderBy('name')->get(),
            'customers' => Customer::all(),
            'commodityTypes' => CommodityType::with('commodities')->orderBy('name')->get(),
            'commodities' => Commodity::with('commodityType')->orderBy('commodity_code')->get(),
            'tests' => Test::orderBy('name')->get(),
            'cmoStatuses' => CmoStatus::orderBy('name')->get(),
            'shippingLines' => ShippingLine::orderBy('name')->get(),
            'feesAndCharges' => FeesAndCharge::all(),
            'containerParks' => ContainerPark::orderBy('name')->get(),
            'terminals' => Terminal::orderBy('name')->get(),
            'transporters' => Transporter::orderBy('name')->get(),
            'containerCodes' => ContainerCode::all(),
            'packers' => Packer::orderBy('name')->get(),
            'stockLocations' => StockLocation::orderBy('site')->orderBy('name')->get(),
            'internalAccounts' => InternalAccount::orderBy('name')->get(),
            'trucks' => Truck::all(),
            'vesselDepartures' => VesselDeparture::with('shippingLine')->orderBy('vessel_eta')->get(),
            'users' => User::all(),
        ];

        if ($request->boolean('cmos')) {
            $data['cmos'] = Cmo::with(['customer', 'commodityType', 'commodity', 'cmoStatus'])->orderBy('cmo_reference')->get();
        }
        if ($request->boolean('tickets')) {
            $data['tickets'] = Ticket::with(['truck', 'commodity', 'cmo', 'unloadedLocation', 'loadingLocation'])->orderByDesc('date')->get();
        }
        if ($request->boolean('packs')) {
            $data['packs'] = Pack::with(['customer', 'commodityType', 'commodity', 'shippingLine', 'vesselDeparture', 'packContainers', 'packBulkTickets'])->orderByDesc('date')->get();
        }
        if ($request->boolean('transactions')) {
            $data['transactions'] = Transaction::with(['commodity', 'location'])->orderBy('transaction_date')->orderBy('id')->get();
        }

        $data['permissions'] = $this->permissionsList();
        $data['userPermissions'] = DB::table('user_permissions')->get()->map(fn ($r) => ['user_id' => (int) $r->user_id, 'permissions' => json_decode($r->permissions ?? '[]', true)])->toArray();

        $shrink = DB::table('settings_shrink')->first();
        $data['defaultShrinkPercent'] = $shrink ? (float) $shrink->default_shrink_percent : 0.5;
        $data['customerCommodityShrink'] = DB::table('customer_commodity_shrink')->get()->map(fn ($r) => ['id' => $r->id, 'customer_id' => (int) $r->customer_id, 'commodity_id' => (int) $r->commodity_id, 'shrink_percent' => $r->shrink_percent])->toArray();

        return $this->success($data);
    }

    private function permissionsList(): array
    {
        return [
            'canSignOffTickets' => ['id' => 'canSignOffTickets', 'label' => 'Can Sign Off Tickets', 'description' => 'Ability to approve and sign off on incoming/outgoing tickets'],
            'canAddCommodity' => ['id' => 'canAddCommodity', 'label' => 'Can Add Commodity', 'description' => 'Ability to create new commodity entries'],
            'canEditCommodity' => ['id' => 'canEditCommodity', 'label' => 'Can Edit Commodity', 'description' => 'Ability to modify existing commodity entries'],
            'canDeleteCommodity' => ['id' => 'canDeleteCommodity', 'label' => 'Can Delete Commodity', 'description' => 'Ability to remove commodity entries'],
            'canAddCustomer' => ['id' => 'canAddCustomer', 'label' => 'Can Add Customer', 'description' => 'Ability to create new customer records'],
            'canEditCustomer' => ['id' => 'canEditCustomer', 'label' => 'Can Edit Customer', 'description' => 'Ability to modify existing customer records'],
            'canDeleteCustomer' => ['id' => 'canDeleteCustomer', 'label' => 'Can Delete Customer', 'description' => 'Ability to remove customer records'],
            'canManageStockLocations' => ['id' => 'canManageStockLocations', 'label' => 'Can Manage Stock Locations', 'description' => 'Ability to add, edit, or delete stock locations'],
            'canViewReports' => ['id' => 'canViewReports', 'label' => 'Can View Reports', 'description' => 'Ability to access and view reports'],
            'canManageTests' => ['id' => 'canManageTests', 'label' => 'Can Manage Tests', 'description' => 'Ability to add, edit, or delete test definitions'],
            'canManageCMO' => ['id' => 'canManageCMO', 'label' => 'Can Manage CMO', 'description' => 'Ability to create and manage CMO records'],
        ];
    }
}

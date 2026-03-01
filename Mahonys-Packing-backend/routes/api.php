<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes - Mahonys Packing System
|--------------------------------------------------------------------------
| REST API for the Next.js frontend. All routes return JSON.
*/

// Reference data (CRUD)
Route::apiResource('countries', \App\Http\Controllers\Api\CountryController::class);
Route::apiResource('customers', \App\Http\Controllers\Api\CustomerController::class);
Route::apiResource('commodity-types', \App\Http\Controllers\Api\CommodityTypeController::class);
Route::apiResource('commodities', \App\Http\Controllers\Api\CommodityController::class);
Route::apiResource('tests', \App\Http\Controllers\Api\TestController::class);
Route::apiResource('shipping-lines', \App\Http\Controllers\Api\ShippingLineController::class);
Route::apiResource('fees-and-charges', \App\Http\Controllers\Api\FeesAndChargeController::class);
Route::apiResource('container-parks', \App\Http\Controllers\Api\ContainerParkController::class);
Route::apiResource('terminals', \App\Http\Controllers\Api\TerminalController::class);
Route::apiResource('transporters', \App\Http\Controllers\Api\TransporterController::class);
Route::apiResource('container-codes', \App\Http\Controllers\Api\ContainerCodeController::class);
Route::apiResource('packers', \App\Http\Controllers\Api\PackerController::class);
Route::apiResource('stock-locations', \App\Http\Controllers\Api\StockLocationController::class);
Route::apiResource('internal-accounts', \App\Http\Controllers\Api\InternalAccountController::class);
Route::apiResource('cmo-statuses', \App\Http\Controllers\Api\CmoStatusController::class);
Route::apiResource('trucks', \App\Http\Controllers\Api\TruckController::class);
Route::apiResource('vessel-departures', \App\Http\Controllers\Api\VesselDepartureController::class);
Route::apiResource('users', \App\Http\Controllers\Api\UserController::class);

// CMOs and bookings
Route::apiResource('cmos', \App\Http\Controllers\Api\CmoController::class);
Route::post('cmos/{cmo}/bookings', [\App\Http\Controllers\Api\CmoController::class, 'addBooking']);
Route::put('cmos/{cmo}/bookings/{booking}', [\App\Http\Controllers\Api\CmoController::class, 'updateBooking']);
Route::delete('cmos/{cmo}/bookings/{booking}', [\App\Http\Controllers\Api\CmoController::class, 'deleteBooking']);

// Tickets (incoming/outgoing)
Route::apiResource('tickets', \App\Http\Controllers\Api\TicketController::class);

// Packs (container/bulk) and nested containers/bulk-tickets
Route::apiResource('packs', \App\Http\Controllers\Api\PackController::class);
Route::post('packs/{pack}/containers', [\App\Http\Controllers\Api\PackController::class, 'addContainer']);
Route::put('packs/{pack}/containers/{container}', [\App\Http\Controllers\Api\PackController::class, 'updateContainer']);
Route::delete('packs/{pack}/containers/{container}', [\App\Http\Controllers\Api\PackController::class, 'deleteContainer']);
Route::post('packs/{pack}/bulk-tickets', [\App\Http\Controllers\Api\PackController::class, 'addBulkTicket']);
Route::put('packs/{pack}/bulk-tickets/{bulkTicket}', [\App\Http\Controllers\Api\PackController::class, 'updateBulkTicket']);
Route::delete('packs/{pack}/bulk-tickets/{bulkTicket}', [\App\Http\Controllers\Api\PackController::class, 'deleteBulkTicket']);

// Transactions (read + filter)
Route::get('transactions', [\App\Http\Controllers\Api\TransactionController::class, 'index']);
Route::get('transactions/by-ticket/{ticketId}', [\App\Http\Controllers\Api\TransactionController::class, 'byTicket']);
Route::get('transactions/by-account/{accountId}', [\App\Http\Controllers\Api\TransactionController::class, 'byAccount']);

// Settings: shrink, packing prices, transport prices
Route::get('settings/shrink', [\App\Http\Controllers\Api\SettingsController::class, 'shrink']);
Route::put('settings/shrink', [\App\Http\Controllers\Api\SettingsController::class, 'updateShrink']);
Route::get('settings/packing-prices', [\App\Http\Controllers\Api\SettingsController::class, 'packingPrices']);
Route::put('settings/packing-prices', [\App\Http\Controllers\Api\SettingsController::class, 'updatePackingPrices']);
Route::get('settings/transport-prices', [\App\Http\Controllers\Api\SettingsController::class, 'transportPrices']);
Route::put('settings/transport-prices', [\App\Http\Controllers\Api\SettingsController::class, 'updateTransportPrices']);

// User permissions
Route::get('users/{user}/permissions', [\App\Http\Controllers\Api\UserController::class, 'permissions']);
Route::put('users/{user}/permissions', [\App\Http\Controllers\Api\UserController::class, 'updatePermissions']);

// Single endpoint to bootstrap app (all reference data + optional filters)
Route::get('app-state', [\App\Http\Controllers\Api\AppStateController::class, 'index']);

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

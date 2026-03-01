<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes - Blade views (optional admin/dashboard)
|--------------------------------------------------------------------------
*/

Route::get('/', function () {
    return view('welcome');
});

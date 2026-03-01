<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vessel_departures', function (Blueprint $table) {
            $table->string('vessel_cutoff_date', 50)->nullable()->change();
            $table->string('vessel_receivals_open_date', 50)->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('vessel_departures', function (Blueprint $table) {
            $table->date('vessel_cutoff_date')->nullable()->change();
            $table->date('vessel_receivals_open_date')->nullable()->change();
        });
    }
};

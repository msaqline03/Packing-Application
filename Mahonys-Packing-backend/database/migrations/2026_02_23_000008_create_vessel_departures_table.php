<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vessel_departures', function (Blueprint $table) {
            $table->id();
            $table->string('vessel')->nullable();
            $table->string('voyage_number', 50)->nullable();
            $table->string('vessel_lloyds', 50)->nullable();
            $table->date('vessel_cutoff_date')->nullable();
            $table->date('vessel_receivals_open_date')->nullable();
            $table->string('vessel_eta', 50)->nullable(); // datetime string
            $table->string('vessel_etd', 50)->nullable();
            $table->integer('vessel_free_days')->nullable();
            $table->foreignId('shipping_line_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vessel_departures');
    }
};

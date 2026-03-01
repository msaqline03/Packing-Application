<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('commodities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('commodity_type_id')->constrained()->cascadeOnDelete();
            $table->string('commodity_code', 50)->nullable();
            $table->string('description')->nullable();
            $table->string('hs_code', 50)->nullable();
            $table->string('pems_code', 50)->nullable();
            $table->string('status', 20)->default('active');
            $table->string('unit_type', 10)->nullable(); // MT
            $table->json('test_thresholds')->nullable();
            $table->string('shrink_amount', 20)->nullable(); // e.g. "0.5%"
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('commodities');
    }
};

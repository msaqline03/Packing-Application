<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tickets', function (Blueprint $table) {
            $table->id();
            $table->string('type', 10); // in, out
            $table->string('status', 30)->default('draft'); // booked, processing, completed, draft
            $table->unsignedSmallInteger('site')->default(1);
            $table->dateTime('date')->nullable();
            $table->string('ticket_reference', 50)->nullable();
            $table->foreignId('truck_id')->nullable()->constrained()->nullOnDelete();
            $table->string('driver_name', 100)->nullable();
            $table->json('gross_weights')->nullable(); // [kg]
            $table->json('tare_weights')->nullable(); // [kg]
            $table->foreignId('commodity_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('cmo_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('unloaded_location')->nullable()->constrained('stock_locations')->nullOnDelete();
            $table->foreignId('loading_location')->nullable()->constrained('stock_locations')->nullOnDelete();
            $table->json('quality')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tickets');
    }
};

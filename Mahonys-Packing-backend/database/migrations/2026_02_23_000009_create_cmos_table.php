<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cmos', function (Blueprint $table) {
            $table->id();
            $table->string('cmo_reference', 50)->nullable();
            $table->string('direction', 10); // in, out
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
            $table->foreignId('commodity_type_id')->constrained()->cascadeOnDelete();
            $table->foreignId('commodity_id')->constrained()->cascadeOnDelete();
            $table->foreignId('cmo_status_id')->nullable()->constrained('cmo_statuses')->nullOnDelete();
            $table->string('status', 50)->nullable(); // Active, Completed, etc.
            $table->decimal('estimated_amount', 12, 2)->nullable();
            $table->json('bookings')->nullable(); // array of { id, ... }
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cmos');
    }
};

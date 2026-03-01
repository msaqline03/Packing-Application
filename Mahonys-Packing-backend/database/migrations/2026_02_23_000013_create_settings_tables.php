<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('settings_shrink', function (Blueprint $table) {
            $table->id();
            $table->decimal('default_shrink_percent', 5, 2)->default(0);
            $table->timestamps();
        });

        Schema::create('customer_commodity_shrink', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
            $table->foreignId('commodity_id')->constrained()->cascadeOnDelete();
            $table->string('shrink_percent', 20)->nullable(); // "0.3%"
            $table->timestamps();
        });

        Schema::create('default_packing_prices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('commodity_type_id')->constrained()->cascadeOnDelete();
            $table->string('container_size', 20)->nullable(); // 20ft, 40ft, 45ft
            $table->decimal('price', 12, 2)->default(0);
            $table->timestamps();
        });

        Schema::create('commodity_prices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('commodity_id')->constrained()->cascadeOnDelete();
            $table->string('container_size', 20)->nullable();
            $table->decimal('price', 12, 2)->default(0);
            $table->timestamps();
        });

        Schema::create('commodity_type_customer_prices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('commodity_type_id')->constrained()->cascadeOnDelete();
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
            $table->string('container_size', 20)->nullable();
            $table->decimal('price', 12, 2)->default(0);
            $table->timestamps();
        });

        Schema::create('commodity_customer_prices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('commodity_id')->constrained()->cascadeOnDelete();
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
            $table->string('container_size', 20)->nullable();
            $table->decimal('price', 12, 2)->default(0);
            $table->timestamps();
        });

        Schema::create('transporter_transport_prices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('transporter_id')->constrained()->cascadeOnDelete();
            $table->string('container_size', 20)->nullable();
            $table->decimal('price', 12, 2)->default(0);
            $table->string('line_item_description')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transporter_transport_prices');
        Schema::dropIfExists('commodity_customer_prices');
        Schema::dropIfExists('commodity_type_customer_prices');
        Schema::dropIfExists('commodity_prices');
        Schema::dropIfExists('default_packing_prices');
        Schema::dropIfExists('customer_commodity_shrink');
        Schema::dropIfExists('settings_shrink');
    }
};

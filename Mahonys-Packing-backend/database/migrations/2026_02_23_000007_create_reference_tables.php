<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fees_and_charges', function (Blueprint $table) {
            $table->id();
            $table->string('charge_name');
            $table->string('charge_description')->nullable();
            $table->decimal('charge_rate', 12, 2)->default(0);
            $table->string('charge_type', 50)->nullable(); // per Container, per Invoice
            $table->boolean('apply_to_all_packs')->default(false);
            $table->string('charge_classification', 50)->nullable(); // revenue, expense
            $table->string('account_code', 20)->nullable();
            $table->timestamps();
        });

        Schema::create('container_parks', function (Blueprint $table) {
            $table->id();
            $table->string('code', 20)->nullable();
            $table->string('name');
            $table->string('container_chain_name')->nullable();
            $table->json('contacts')->nullable();
            $table->text('notes')->nullable();
            $table->decimal('revenue_price', 12, 2)->nullable();
            $table->decimal('expense_price', 12, 2)->nullable();
            $table->timestamps();
        });

        Schema::create('terminals', function (Blueprint $table) {
            $table->id();
            $table->string('code', 20)->nullable();
            $table->string('name');
            $table->json('contacts')->nullable();
            $table->text('notes')->nullable();
            $table->decimal('revenue_price', 12, 2)->nullable();
            $table->decimal('expense_price', 12, 2)->nullable();
            $table->timestamps();
        });

        Schema::create('transporters', function (Blueprint $table) {
            $table->id();
            $table->string('code', 20)->nullable();
            $table->string('name');
            $table->timestamps();
        });

        Schema::create('container_codes', function (Blueprint $table) {
            $table->id();
            $table->string('iso_code', 20)->nullable();
            $table->string('container_size', 20)->nullable(); // 20ft, 40ft, 45ft
            $table->string('description')->nullable();
            $table->decimal('cubic_meters', 10, 2)->nullable();
            $table->integer('average_weight')->nullable();
            $table->integer('max_weight')->nullable();
            $table->integer('average_empty_tare')->nullable();
            $table->timestamps();
        });

        Schema::create('packers', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('status', 30)->default('active'); // active, under_maintenance
            $table->json('commodity_types_allowed')->nullable(); // array of ids, empty = all
            $table->json('stock_locations_allowed')->nullable();
            $table->timestamps();
        });

        Schema::create('stock_locations', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->unsignedSmallInteger('site')->default(1);
            $table->string('status', 20)->default('active');
            $table->string('location_type', 30)->nullable(); // Bay, Silo, Pile
            $table->integer('capacity')->nullable();
            $table->timestamps();
        });

        Schema::create('internal_accounts', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->boolean('shrink_applied')->default(false);
            $table->boolean('shrink_receival_account')->default(false);
            $table->timestamps();
        });

        Schema::create('cmo_statuses', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('color', 20)->nullable();
            $table->timestamps();
        });

        Schema::create('trucks', function (Blueprint $table) {
            $table->id();
            $table->string('name', 50)->nullable();
            $table->string('driver', 100)->nullable();
            $table->integer('tare')->nullable(); // kg
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('trucks');
        Schema::dropIfExists('cmo_statuses');
        Schema::dropIfExists('internal_accounts');
        Schema::dropIfExists('stock_locations');
        Schema::dropIfExists('packers');
        Schema::dropIfExists('container_codes');
        Schema::dropIfExists('transporters');
        Schema::dropIfExists('terminals');
        Schema::dropIfExists('container_parks');
        Schema::dropIfExists('fees_and_charges');
    }
};

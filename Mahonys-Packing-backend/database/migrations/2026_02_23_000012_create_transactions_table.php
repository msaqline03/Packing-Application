<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->date('transaction_date');
            $table->unsignedBigInteger('ticket_id'); // can be ticket.id or container.id or bulk_ticket.id
            $table->string('ticket_type', 30); // in, out, container-in, container-out, bulk-in, bulk-out, adjustment
            $table->unsignedBigInteger('account_id'); // customer or internal account id
            $table->string('account_type', 20); // customer, internal
            $table->foreignId('commodity_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('commodity_type_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('location_id')->nullable()->constrained('stock_locations')->nullOnDelete();
            $table->unsignedSmallInteger('site')->default(1);
            $table->string('transaction_type', 30); // deposit, withdrawal, shrinkage, adjustment
            $table->decimal('quantity', 14, 4); // MT, can be negative
            $table->string('reference', 100)->nullable();
            $table->text('notes')->nullable();
            $table->string('status', 20)->default('active'); // active, adjusted, reversed
            $table->unsignedBigInteger('adjustment_of')->nullable(); // id of transaction this adjusts
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};

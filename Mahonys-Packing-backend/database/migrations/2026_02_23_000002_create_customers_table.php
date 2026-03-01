<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->string('code', 50)->nullable();
            $table->string('name');
            $table->json('emails')->nullable(); // array of strings
            $table->json('contacts')->nullable(); // [{ name, email, phone }]
            $table->json('addresses')->nullable();
            $table->string('website')->nullable();
            $table->text('notes')->nullable();
            $table->string('invoicing_contact')->nullable();
            $table->json('warnings')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customers');
    }
};

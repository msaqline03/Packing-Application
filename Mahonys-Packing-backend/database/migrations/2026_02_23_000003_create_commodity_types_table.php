<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('commodity_types', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('acos_code', 50)->nullable();
            $table->string('test_required', 10)->nullable(); // yes/no
            $table->string('shrink_percent', 20)->nullable(); // e.g. "0.5%"
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('commodity_types');
    }
};

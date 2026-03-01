<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('countries', function (Blueprint $table) {
            $table->text('notes')->nullable()->after('name');
            $table->json('contacts')->nullable()->after('notes');
            $table->json('warnings')->nullable()->after('contacts');
        });
    }

    public function down(): void
    {
        Schema::table('countries', function (Blueprint $table) {
            $table->dropColumn(['notes', 'contacts', 'warnings']);
        });
    }
};

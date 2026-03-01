<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('packs', function (Blueprint $table) {
            $table->id();
            $table->string('pack_type', 20); // container, bulk
            $table->string('import_export', 20)->nullable(); // Import, Export
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
            $table->string('exporter')->nullable();
            $table->foreignId('commodity_type_id')->constrained()->cascadeOnDelete();
            $table->foreignId('commodity_id')->constrained()->cascadeOnDelete();
            $table->string('status', 50)->nullable(); // Pending, Inprogress, Approved, etc.
            $table->string('job_reference', 50)->nullable();
            $table->string('fumigation')->nullable();
            $table->unsignedSmallInteger('containers_required')->nullable();
            $table->json('release_ids')->nullable();
            $table->json('release_details')->nullable();
            $table->json('empty_container_park_ids')->nullable();
            $table->json('transporter_ids')->nullable();
            $table->json('assigned_packer_ids')->nullable();
            $table->unsignedSmallInteger('site_id')->default(1);
            $table->decimal('quantity_per_container', 10, 2)->nullable();
            $table->decimal('max_qty_per_container', 10, 2)->nullable();
            $table->decimal('mt_total', 12, 2)->nullable();
            $table->string('destination_country')->nullable();
            $table->string('destination_port')->nullable();
            $table->string('transshipment_port')->nullable();
            $table->string('transshipment_port_code', 20)->nullable();
            $table->foreignId('shipping_line_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('vessel_departure_id')->nullable()->constrained()->nullOnDelete();
            $table->boolean('import_permit_required')->default(false);
            $table->string('import_permit_number', 50)->nullable();
            $table->date('import_permit_date')->nullable();
            $table->json('import_permit_files')->nullable();
            $table->string('rfp', 50)->nullable();
            $table->boolean('rfp_additional_declaration_required')->default(false);
            $table->json('additional_declaration_files')->nullable();
            $table->json('rfp_files')->nullable();
            $table->text('rfp_comment')->nullable();
            $table->date('rfp_expiry')->nullable();
            $table->string('rfp_commodity_code', 20)->nullable();
            $table->boolean('sample_required')->default(false);
            $table->json('sample_locations')->nullable();
            $table->json('sample_sent_dates')->nullable();
            $table->json('sample_statuses')->nullable();
            $table->json('packing_instruction_files')->nullable();
            $table->text('job_notes')->nullable();
            $table->date('date')->nullable();
            $table->foreignId('scheduled_packer_id')->nullable()->constrained('packers')->nullOnDelete();
            $table->boolean('test_required')->default(false);
            $table->boolean('shrink_taken')->default(false);
            $table->json('verification')->nullable();
            $table->timestamps();
        });

        Schema::create('pack_containers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pack_id')->constrained()->cascadeOnDelete();
            $table->string('container_number', 50)->nullable();
            $table->string('seal_number', 50)->nullable();
            $table->string('container_iso_code', 20)->nullable();
            $table->dateTime('start_date_time')->nullable();
            $table->foreignId('stock_location_id')->nullable()->constrained('stock_locations')->nullOnDelete();
            $table->foreignId('packer_id')->nullable()->constrained()->nullOnDelete();
            $table->integer('tare')->nullable();
            $table->integer('container_tare')->nullable();
            $table->integer('gross')->nullable();
            $table->integer('nett')->nullable();
            $table->string('release_ref', 50)->nullable();
            $table->foreignId('empty_container_park_id')->nullable()->constrained('container_parks')->nullOnDelete();
            $table->foreignId('transporter_id')->nullable()->constrained()->nullOnDelete();
            $table->string('packer_signoff')->nullable();
            $table->string('packer_signoff_date_time')->nullable();
            $table->string('authorised_officer')->nullable();
            $table->string('empty_container_inspection_result', 20)->nullable();
            $table->text('empty_container_inspection_remark')->nullable();
            $table->string('grain_inspection_result', 20)->nullable();
            $table->text('grain_inspection_remark')->nullable();
            $table->string('authorised_officer_signoff')->nullable();
            $table->string('authorised_officer_signoff_date_time')->nullable();
            $table->string('status', 20)->default('draft'); // draft, completed
            $table->timestamps();
        });

        Schema::create('pack_bulk_tickets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pack_id')->constrained()->cascadeOnDelete();
            $table->date('date')->nullable();
            $table->foreignId('truck_id')->nullable()->constrained()->nullOnDelete();
            $table->integer('gross_weight')->nullable(); // kg
            $table->integer('tare_weight')->nullable(); // kg
            $table->foreignId('location_id')->nullable(); // stock_location_id
            $table->string('signoff')->nullable();
            $table->json('test_results')->nullable();
            $table->text('notes')->nullable();
            $table->string('status', 20)->default('draft');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pack_bulk_tickets');
        Schema::dropIfExists('pack_containers');
        Schema::dropIfExists('packs');
    }
};

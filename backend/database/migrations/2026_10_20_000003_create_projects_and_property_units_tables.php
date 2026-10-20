<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('projects', function (Blueprint $table): void {
            $table->id(); $table->string('code', 32)->unique(); $table->string('name'); $table->string('name_km')->nullable();
            $table->string('type', 40)->default('residential'); $table->string('location')->nullable(); $table->decimal('total_land_area', 14, 2)->nullable();
            $table->date('start_date')->nullable(); $table->date('expected_completion_date')->nullable();
            $table->enum('status', ['planning', 'active', 'selling', 'completed', 'suspended', 'archived'])->default('planning');
            $table->string('reporting_currency', 3)->default('USD'); $table->text('description')->nullable(); $table->timestamps();
        });
        Schema::create('property_units', function (Blueprint $table): void {
            $table->id(); $table->foreignId('project_id')->constrained()->cascadeOnDelete(); $table->string('unit_code', 40);
            $table->string('zone')->nullable(); $table->string('property_type', 40); $table->decimal('land_area', 14, 2)->nullable();
            $table->decimal('building_area', 14, 2)->nullable(); $table->decimal('listing_price', 15, 2); $table->char('currency', 3)->default('USD');
            $table->enum('status', ['available', 'reserved', 'deposit_paid', 'contract_signed', 'installment_active', 'fully_paid', 'transferred', 'on_hold', 'cancelled'])->default('available');
            $table->string('facing_direction', 30)->nullable(); $table->unsignedTinyInteger('bedrooms')->nullable(); $table->unsignedTinyInteger('bathrooms')->nullable(); $table->text('notes')->nullable(); $table->timestamps();
            $table->unique(['project_id', 'unit_code']); $table->index(['project_id', 'status']);
        });
    }
    public function down(): void { Schema::dropIfExists('property_units'); Schema::dropIfExists('projects'); }
};

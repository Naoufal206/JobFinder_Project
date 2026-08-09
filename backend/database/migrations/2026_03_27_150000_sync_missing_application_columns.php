<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasTable('applications')) {
            return;
        }

        Schema::table('applications', function (Blueprint $table) {
            if (!Schema::hasColumn('applications', 'full_name')) {
                $table->string('full_name')->nullable()->after('job_id');
            }

            if (!Schema::hasColumn('applications', 'email')) {
                $table->string('email')->nullable()->after('full_name');
            }

            if (!Schema::hasColumn('applications', 'cv')) {
                $table->string('cv')->nullable()->after('email');
            }

            if (!Schema::hasColumn('applications', 'letter')) {
                $table->text('letter')->nullable()->after('cv');
            }

            if (!Schema::hasColumn('applications', 'status')) {
                $table->string('status')->default('pending')->after('letter');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Intentionally left empty: this migration only patches legacy schemas.
    }
};

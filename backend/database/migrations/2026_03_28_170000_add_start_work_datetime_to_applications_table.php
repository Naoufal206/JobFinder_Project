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
            if (!Schema::hasColumn('applications', 'start_work_datetime')) {
                $table->dateTime('start_work_datetime')->nullable()->after('interview_location');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (!Schema::hasTable('applications') || !Schema::hasColumn('applications', 'start_work_datetime')) {
            return;
        }

        Schema::table('applications', function (Blueprint $table) {
            $table->dropColumn('start_work_datetime');
        });
    }
};

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
            if (!Schema::hasColumn('applications', 'interview_datetime')) {
                $table->dateTime('interview_datetime')->nullable()->after('status');
            }

            if (!Schema::hasColumn('applications', 'interview_location')) {
                $table->string('interview_location')->nullable()->after('interview_datetime');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (!Schema::hasTable('applications')) {
            return;
        }

        Schema::table('applications', function (Blueprint $table) {
            if (Schema::hasColumn('applications', 'interview_location')) {
                $table->dropColumn('interview_location');
            }

            if (Schema::hasColumn('applications', 'interview_datetime')) {
                $table->dropColumn('interview_datetime');
            }
        });
    }
};

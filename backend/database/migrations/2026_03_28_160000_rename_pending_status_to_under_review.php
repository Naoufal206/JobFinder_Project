<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasTable('applications') || !Schema::hasColumn('applications', 'status')) {
            return;
        }

        DB::table('applications')
            ->where('status', 'pending')
            ->update(['status' => 'under review']);

        $driver = DB::getDriverName();

        if (in_array($driver, ['mysql', 'mariadb'], true)) {
            DB::statement("ALTER TABLE applications MODIFY status VARCHAR(50) NOT NULL DEFAULT 'under review'");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (!Schema::hasTable('applications') || !Schema::hasColumn('applications', 'status')) {
            return;
        }

        DB::table('applications')
            ->where('status', 'under review')
            ->update(['status' => 'pending']);

        $driver = DB::getDriverName();

        if (in_array($driver, ['mysql', 'mariadb'], true)) {
            DB::statement("ALTER TABLE applications MODIFY status VARCHAR(50) NOT NULL DEFAULT 'pending'");
        }
    }
};

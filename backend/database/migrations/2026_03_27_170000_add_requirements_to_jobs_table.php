<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('jobs') || Schema::hasColumn('jobs', 'requirements')) {
            return;
        }

        Schema::table('jobs', function (Blueprint $table) {
            $table->text('requirements')->nullable()->after('description');
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('jobs') || ! Schema::hasColumn('jobs', 'requirements')) {
            return;
        }

        Schema::table('jobs', function (Blueprint $table) {
            $table->dropColumn('requirements');
        });
    }
};

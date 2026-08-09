<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('jobs', 'company')) {
            Schema::table('jobs', function (Blueprint $table) {
                $table->string('company')->nullable()->after('title');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('jobs', 'company')) {
            Schema::table('jobs', function (Blueprint $table) {
                $table->dropColumn('company');
            });
        }
    }
};

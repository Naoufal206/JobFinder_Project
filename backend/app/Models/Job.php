<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Job extends Model
{
    protected $fillable = [
        'title',
        'company',
        'description',
        'requirements',
        'location',
        'salary',
        'admin_id',
    ];

    public function applications()
    {
        return $this->hasMany(Application::class);
    }
}

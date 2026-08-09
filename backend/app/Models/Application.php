<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Application extends Model
{
    protected $fillable = [
        'user_id',
        'job_id',
        'full_name',
        'email',
        'cv',
        'letter',
        'status',
        'interview_datetime',
        'interview_location',
        'start_work_datetime',
    ];

    protected $casts = [
        'interview_datetime' => 'datetime',
        'start_work_datetime' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function job()
    {
        return $this->belongsTo(Job::class);
    }
}

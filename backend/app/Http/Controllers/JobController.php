<?php

namespace App\Http\Controllers;

use App\Models\Job;
use Illuminate\Http\Request;

class JobController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:150',
            'company' => 'nullable|string|max:150',
            'description' => 'required|string',
            'requirements' => 'nullable|string',
            'location' => 'nullable|string',
            'salary' => 'nullable|string',
        ]);

        $job = Job::create([
            'title' => $request->title,
            'company' => $request->company,
            'description' => $request->description,
            'requirements' => $request->requirements,
            'location' => $request->location,
            'salary' => $request->salary,
            'admin_id' => auth()->id() ?? 1,
        ]);

        return response()->json([
            'success' => true,
            'job' => $job,
        ]);
    }

    public function index()
    {
        $jobs = Job::latest()->get();

        return response()->json($jobs);
    }
}

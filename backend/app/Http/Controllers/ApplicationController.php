<?php

namespace App\Http\Controllers;

use App\Models\Application;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ApplicationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->role !== 'applicant') {
            return response()->json([
                'message' => 'Only applicants can view their job applications.',
            ], 403);
        }

        $applications = Application::with('job')
            ->where('user_id', $user->id)
            ->latest()
            ->get();

        return response()->json($applications);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->role !== 'applicant') {
            return response()->json([
                'message' => 'Only applicants can apply for jobs.',
            ], 403);
        }

        $validated = $request->validate([
            'job_id' => 'required|exists:jobs,id',
            'full_name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'cv' => 'nullable|file|mimes:pdf,doc,docx|max:2048',
        ]);

        $alreadyApplied = Application::where('job_id', $validated['job_id'])
            ->where('user_id', $user->id)
            ->exists();

        if ($alreadyApplied) {
            return response()->json([
                'message' => 'You have already applied for this job.',
            ], 422);
        }

        $cvPath = $request->file('cv')
            ? $request->file('cv')->store('cvs', 'public')
            : null;

        $application = Application::create([
            'job_id' => $validated['job_id'],
            'user_id' => $user->id,
            'full_name' => $validated['full_name'],
            'email' => $validated['email'],
            'cv' => $cvPath,
            'letter' => '',
            'status' => 'under review',
        ]);

        return response()->json([
            'success' => true,
            'application' => $application,
        ], 201);
    }
}

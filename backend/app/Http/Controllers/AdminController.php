<?php

namespace App\Http\Controllers;

use App\Mail\ApplicationAcceptedMail;
use App\Mail\InterviewInvitationMail;
use App\Models\Application;
use App\Models\Job;
use Throwable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class AdminController extends Controller
{
    protected function ensureAdmin(Request $request): ?JsonResponse
    {
        if ($request->user()?->role !== 'admin') {
            return response()->json([
                'message' => 'Admin access is required.',
            ], 403);
        }

        return null;
    }

    public function jobsWithApplicants(Request $request): JsonResponse
    {
        if ($response = $this->ensureAdmin($request)) {
            return $response;
        }

        $jobs = Job::where('admin_id', $request->user()->id)
            ->withCount('applications')
            ->with([
                'applications' => function ($query) {
                    $query
                        ->select(
                            'id',
                            'job_id',
                            'full_name',
                            'email',
                            'cv',
                            'status',
                            'interview_datetime',
                            'interview_location',
                            'start_work_datetime',
                            'created_at'
                        )
                        ->latest();
                },
            ])
            ->latest()
            ->get();

        return response()->json($jobs);
    }

    public function jobApplications(Request $request, int $id): JsonResponse
    {
        if ($response = $this->ensureAdmin($request)) {
            return $response;
        }

        $job = Job::where('admin_id', $request->user()->id)
            ->with([
                'applications' => function ($query) {
                    $query
                        ->select(
                            'id',
                            'job_id',
                            'full_name',
                            'email',
                            'cv',
                            'status',
                            'interview_datetime',
                            'interview_location',
                            'start_work_datetime',
                            'created_at'
                        )
                        ->latest();
                },
            ])
            ->withCount('applications')
            ->findOrFail($id);

        return response()->json($job);
    }

    public function updateApplicationStatus(Request $request, int $id): JsonResponse
    {
        if ($response = $this->ensureAdmin($request)) {
            return $response;
        }

        $validated = $request->validate([
            'status' => 'required|in:under review,rejected,Interview Scheduled',
        ]);

        $application = Application::whereHas('job', function ($query) use ($request) {
            $query->where('admin_id', $request->user()->id);
        })->findOrFail($id);

        $application->update([
            'status' => $validated['status'],
        ]);

        return response()->json([
            'success' => true,
            'application' => $application->fresh(),
        ]);
    }

    public function viewApplicationCv(Request $request, int $id): JsonResponse|BinaryFileResponse
    {
        if ($response = $this->ensureAdmin($request)) {
            return $response;
        }

        $application = Application::whereHas('job', function ($query) use ($request) {
            $query->where('admin_id', $request->user()->id);
        })->findOrFail($id);

        if (!$application->cv) {
            return response()->json([
                'message' => 'No resume is attached to this application.',
            ], 404);
        }

        if (!Storage::disk('public')->exists($application->cv)) {
            return response()->json([
                'message' => 'Resume file not found.',
            ], 404);
        }

        $path = Storage::disk('public')->path($application->cv);
        $mimeType = Storage::disk('public')->mimeType($application->cv) ?: 'application/octet-stream';

        return response()->file($path, [
            'Content-Type' => $mimeType,
            'Content-Disposition' => 'inline; filename="'.basename($application->cv).'"',
        ]);
    }

    public function scheduleInterview(Request $request, int $id): JsonResponse
    {
        if ($response = $this->ensureAdmin($request)) {
            return $response;
        }

        $validated = $request->validate([
            'interview_date' => 'required|date',
            'interview_time' => 'required|date_format:H:i',
            'interview_location' => 'required|string|max:255',
        ]);

        $application = Application::whereHas('job', function ($query) use ($request) {
            $query->where('admin_id', $request->user()->id);
        })->findOrFail($id);

        $interviewDateTime = Carbon::createFromFormat(
            'Y-m-d H:i',
            "{$validated['interview_date']} {$validated['interview_time']}"
        );

        $application->update([
            'status' => 'Interview Scheduled',
            'interview_datetime' => $interviewDateTime,
            'interview_location' => $validated['interview_location'],
            'start_work_datetime' => null,
        ]);

        try {
            Mail::to($application->email)->send(new InterviewInvitationMail($application->fresh()));
        } catch (Throwable $exception) {
            Log::error('Interview email could not be sent.', [
                'application_id' => $application->id,
                'email' => $application->email,
                'error' => $exception->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Interview was saved, but the email could not be sent. Check your SMTP connection or firewall settings.',
            ], 502);
        }

        return response()->json([
            'success' => true,
            'message' => 'Interview scheduled successfully.',
            'application' => $application->fresh(),
        ]);
    }

    public function acceptApplication(Request $request, int $id): JsonResponse
    {
        if ($response = $this->ensureAdmin($request)) {
            return $response;
        }

        $validated = $request->validate([
            'start_work_date' => 'required|date',
            'start_work_time' => 'required|date_format:H:i',
        ]);

        $application = Application::whereHas('job', function ($query) use ($request) {
            $query->where('admin_id', $request->user()->id);
        })->findOrFail($id);

        if ($application->status !== 'Interview Scheduled') {
            return response()->json([
                'success' => false,
                'message' => 'Only interviewed candidates can be accepted.',
            ], 422);
        }

        $startWorkDateTime = Carbon::createFromFormat(
            'Y-m-d H:i',
            "{$validated['start_work_date']} {$validated['start_work_time']}"
        );

        $application->update([
            'status' => 'accepted',
            'start_work_datetime' => $startWorkDateTime,
        ]);

        try {
            Mail::to($application->email)->send(new ApplicationAcceptedMail($application->fresh()));
        } catch (Throwable $exception) {
            Log::error('Acceptance email could not be sent.', [
                'application_id' => $application->id,
                'email' => $application->email,
                'error' => $exception->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Candidate was accepted, but the acceptance email could not be sent. Check your SMTP connection or firewall settings.',
            ], 502);
        }

        return response()->json([
            'success' => true,
            'message' => 'Candidate accepted successfully.',
            'application' => $application->fresh(),
        ]);
    }

    public function storeJob(Request $request): JsonResponse
    {
        if ($response = $this->ensureAdmin($request)) {
            return $response;
        }

        $validated = $request->validate([
            'title' => 'required|string|max:150',
            'company' => 'nullable|string|max:150',
            'description' => 'required|string',
            'requirements' => 'nullable|string',
            'location' => 'nullable|string|max:100',
            'salary' => 'nullable|string|max:100',
        ]);

        $job = Job::create([
            'title' => $validated['title'],
            'company' => $validated['company'] ?? null,
            'description' => $validated['description'],
            'requirements' => $validated['requirements'] ?? null,
            'location' => $validated['location'] ?? null,
            'salary' => $validated['salary'] ?? null,
            'admin_id' => $request->user()->id,
        ]);

        return response()->json([
            'success' => true,
            'job' => $job,
        ], 201);
    }

    public function updateJob(Request $request, int $id): JsonResponse
    {
        if ($response = $this->ensureAdmin($request)) {
            return $response;
        }

        $validated = $request->validate([
            'title' => 'required|string|max:150',
            'company' => 'nullable|string|max:150',
            'description' => 'required|string',
            'requirements' => 'nullable|string',
            'location' => 'nullable|string|max:100',
            'salary' => 'nullable|string|max:100',
        ]);

        $job = Job::where('admin_id', $request->user()->id)->findOrFail($id);
        $job->update($validated);

        return response()->json([
            'success' => true,
            'job' => $job,
        ]);
    }

    public function deleteJob(Request $request, int $id): JsonResponse
    {
        if ($response = $this->ensureAdmin($request)) {
            return $response;
        }

        $job = Job::where('admin_id', $request->user()->id)->findOrFail($id);
        $job->delete();

        return response()->json([
            'success' => true,
            'message' => 'Job deleted',
        ]);
    }
}

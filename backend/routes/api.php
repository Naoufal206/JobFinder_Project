<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\JobController;
use App\Http\Controllers\ApplicationController;
use App\Http\Controllers\AdminController;

// ======== Public Routes ========
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::get('/jobs', [JobController::class, 'index']);

// ======== Protected Routes ========
Route::middleware('auth:sanctum')->group(function () {
    // Profile
    Route::get('/user', [AuthController::class, 'getProfile']);
    Route::put('/profile', [AuthController::class, 'updateProfile']);
    Route::post('/profile', [AuthController::class, 'updateProfile']);
    Route::get('/applications', [ApplicationController::class, 'index']);
    Route::post('/apply', [ApplicationController::class, 'store']);
    Route::post('/apply-job', [ApplicationController::class, 'store']);

    // Admin Jobs
    Route::get('/admin/jobs-applicants', [AdminController::class, 'jobsWithApplicants']);
    Route::get('/admin/jobs-with-count', [AdminController::class, 'jobsWithApplicants']);
    Route::get('/admin/jobs/{id}/applications', [AdminController::class, 'jobApplications']);
    Route::get('/admin/applications/{id}/cv', [AdminController::class, 'viewApplicationCv']);
    Route::post('/admin/jobs', [AdminController::class, 'storeJob']);
    Route::put('/admin/jobs/{id}', [AdminController::class, 'updateJob']);
    Route::delete('/admin/jobs/{id}', [AdminController::class, 'deleteJob']);
    Route::patch('/admin/applications/{id}/status', [AdminController::class, 'updateApplicationStatus']);
    Route::post('/admin/applications/{id}/schedule-interview', [AdminController::class, 'scheduleInterview']);
    Route::post('/admin/applications/{id}/accept', [AdminController::class, 'acceptApplication']);
});

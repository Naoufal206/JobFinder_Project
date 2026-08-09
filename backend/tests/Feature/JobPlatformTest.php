<?php

namespace Tests\Feature;

use App\Mail\ApplicationAcceptedMail;
use App\Mail\InterviewInvitationMail;
use App\Models\Application;
use App\Models\Job;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class JobPlatformTest extends TestCase
{
    use RefreshDatabase;

    public function test_applicant_can_register_and_receive_a_token(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'Alice Applicant',
            'email' => 'alice@example.com',
            'password' => 'secret123',
            'role' => 'applicant',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('user.email', 'alice@example.com')
            ->assertJsonStructure(['token']);
    }

    public function test_admin_can_create_and_list_their_own_jobs(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $otherAdmin = User::factory()->create(['role' => 'admin']);

        Job::create([
            'title' => 'Other Admin Job',
            'description' => 'Should not appear for the current admin.',
            'requirements' => 'Other admin requirements',
            'location' => 'Remote',
            'salary' => '$1000',
            'admin_id' => $otherAdmin->id,
        ]);

        $createResponse = $this->actingAs($admin, 'sanctum')->postJson('/api/admin/jobs', [
            'title' => 'Backend Developer',
            'description' => 'Build APIs',
            'requirements' => 'Laravel, SQL, REST',
            'location' => 'Paris',
            'salary' => '$2000',
        ]);

        $createResponse
            ->assertCreated()
            ->assertJsonPath('job.admin_id', $admin->id)
            ->assertJsonPath('job.requirements', 'Laravel, SQL, REST');

        $listResponse = $this->actingAs($admin, 'sanctum')->getJson('/api/admin/jobs-with-count');

        $listResponse
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.title', 'Backend Developer')
            ->assertJsonPath('0.requirements', 'Laravel, SQL, REST');
    }

    public function test_applicant_can_apply_only_once_to_the_same_job(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $applicant = User::factory()->create([
            'role' => 'applicant',
            'email' => 'candidate@example.com',
        ]);

        $job = Job::create([
            'title' => 'Frontend Developer',
            'description' => 'Build UI',
            'requirements' => 'React, CSS',
            'location' => 'Remote',
            'salary' => '$1800',
            'admin_id' => $admin->id,
        ]);

        $payload = [
            'job_id' => $job->id,
            'full_name' => 'Candidate One',
            'email' => 'candidate@example.com',
        ];

        $firstResponse = $this->actingAs($applicant, 'sanctum')->postJson('/api/apply-job', $payload);
        $secondResponse = $this->actingAs($applicant, 'sanctum')->postJson('/api/apply-job', $payload);

        $firstResponse->assertCreated();
        $secondResponse->assertStatus(422);

        $this->assertDatabaseCount('applications', 1);
    }

    public function test_admin_cannot_apply_for_a_job(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $jobOwner = User::factory()->create(['role' => 'admin']);

        $job = Job::create([
            'title' => 'QA Engineer',
            'description' => 'Test everything',
            'requirements' => 'Automation, Cypress',
            'location' => 'Lyon',
            'salary' => '$1500',
            'admin_id' => $jobOwner->id,
        ]);

        $response = $this->actingAs($admin, 'sanctum')->postJson('/api/apply-job', [
            'job_id' => $job->id,
            'full_name' => 'Admin User',
            'email' => 'admin@example.com',
        ]);

        $response->assertForbidden();
        $this->assertDatabaseMissing('applications', ['job_id' => $job->id, 'user_id' => $admin->id]);
        $this->assertSame(0, Application::count());
    }

    public function test_admin_can_view_job_applications_and_reject_candidate(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $applicant = User::factory()->create(['role' => 'applicant']);

        $job = Job::create([
            'title' => 'Product Designer',
            'description' => 'Design interfaces',
            'requirements' => 'Figma, UX',
            'location' => 'Remote',
            'salary' => '$2200',
            'admin_id' => $admin->id,
        ]);

        $application = Application::create([
            'job_id' => $job->id,
            'user_id' => $applicant->id,
            'full_name' => 'Sara Candidate',
            'email' => 'sara@example.com',
            'cv' => 'cvs/sample.pdf',
            'letter' => '',
            'status' => 'under review',
        ]);

        $listResponse = $this->actingAs($admin, 'sanctum')->getJson('/api/admin/jobs-with-count');

        $listResponse
            ->assertOk()
            ->assertJsonPath('0.title', 'Product Designer')
            ->assertJsonPath('0.applications.0.full_name', 'Sara Candidate')
            ->assertJsonPath('0.applications.0.email', 'sara@example.com')
            ->assertJsonPath('0.applications.0.status', 'under review');

        $jobApplicationsResponse = $this->actingAs($admin, 'sanctum')
            ->getJson("/api/admin/jobs/{$job->id}/applications");

        $jobApplicationsResponse
            ->assertOk()
            ->assertJsonPath('id', $job->id)
            ->assertJsonPath('applications.0.full_name', 'Sara Candidate');

        $updateResponse = $this->actingAs($admin, 'sanctum')->patchJson(
            "/api/admin/applications/{$application->id}/status",
            ['status' => 'rejected']
        );

        $updateResponse
            ->assertOk()
            ->assertJsonPath('application.status', 'rejected');

        $this->assertDatabaseHas('applications', [
            'id' => $application->id,
            'status' => 'rejected',
        ]);
    }

    public function test_admin_can_schedule_an_interview_and_send_email(): void
    {
        Mail::fake();

        $admin = User::factory()->create(['role' => 'admin']);
        $applicant = User::factory()->create(['role' => 'applicant']);

        $job = Job::create([
            'title' => 'Laravel Developer',
            'description' => 'Build APIs and admin tools',
            'requirements' => 'Laravel, MySQL',
            'location' => 'Paris',
            'salary' => '$2500',
            'admin_id' => $admin->id,
        ]);

        $application = Application::create([
            'job_id' => $job->id,
            'user_id' => $applicant->id,
            'full_name' => 'Jane Candidate',
            'email' => 'jane@example.com',
            'cv' => 'cvs/jane.pdf',
            'letter' => '',
            'status' => 'under review',
        ]);

        $response = $this->actingAs($admin, 'sanctum')->postJson(
            "/api/admin/applications/{$application->id}/schedule-interview",
            [
                'interview_date' => '2026-04-10',
                'interview_time' => '14:30',
                'interview_location' => 'https://meet.example.com/interview-room',
            ]
        );

        $response
            ->assertOk()
            ->assertJsonPath('application.status', 'Interview Scheduled')
            ->assertJsonPath('application.interview_location', 'https://meet.example.com/interview-room');

        $this->assertDatabaseHas('applications', [
            'id' => $application->id,
            'status' => 'Interview Scheduled',
            'interview_location' => 'https://meet.example.com/interview-room',
        ]);

        Mail::assertSent(InterviewInvitationMail::class, function (InterviewInvitationMail $mail) use ($application) {
            return $mail->hasTo($application->email);
        });
    }

    public function test_admin_can_accept_candidate_after_interview_and_send_email(): void
    {
        Mail::fake();

        $admin = User::factory()->create(['role' => 'admin']);
        $applicant = User::factory()->create(['role' => 'applicant']);

        $job = Job::create([
            'title' => 'Support Engineer',
            'description' => 'Help customers and internal teams',
            'requirements' => 'Communication, troubleshooting',
            'location' => 'Fes',
            'salary' => '$1700',
            'admin_id' => $admin->id,
        ]);

        $application = Application::create([
            'job_id' => $job->id,
            'user_id' => $applicant->id,
            'full_name' => 'Nora Candidate',
            'email' => 'nora@example.com',
            'cv' => 'cvs/nora.pdf',
            'letter' => '',
            'status' => 'Interview Scheduled',
        ]);

        $response = $this->actingAs($admin, 'sanctum')->postJson(
            "/api/admin/applications/{$application->id}/accept",
            [
                'start_work_date' => '2026-04-15',
                'start_work_time' => '09:00',
            ]
        );

        $response
            ->assertOk()
            ->assertJsonPath('application.status', 'accepted');

        $this->assertDatabaseHas('applications', [
            'id' => $application->id,
            'status' => 'accepted',
        ]);

        Mail::assertSent(ApplicationAcceptedMail::class, function (ApplicationAcceptedMail $mail) use ($application) {
            return $mail->hasTo($application->email);
        });
    }
}

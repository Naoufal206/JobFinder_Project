<?php

namespace App\Mail;

use App\Models\Application;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class InterviewInvitationMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Application $application)
    {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Interview Invitation',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.interview-invitation',
            with: [
                'application' => $this->application,
                'interviewDate' => optional($this->application->interview_datetime)?->format('F j, Y'),
                'interviewTime' => optional($this->application->interview_datetime)?->format('g:i A'),
            ],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}

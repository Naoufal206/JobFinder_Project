<?php

namespace App\Mail;

use App\Models\Application;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ApplicationAcceptedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Application $application)
    {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Job Application Accepted',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.application-accepted',
            with: [
                'application' => $this->application,
                'startWorkDate' => optional($this->application->start_work_datetime)?->format('F j, Y'),
                'startWorkTime' => optional($this->application->start_work_datetime)?->format('g:i A'),
            ],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}

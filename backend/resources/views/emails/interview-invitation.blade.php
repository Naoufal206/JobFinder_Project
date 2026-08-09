<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Interview Invitation</title>
</head>
<body style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
    <p>Hello {{ $application->full_name }},</p>

    <p>Congratulations! You have been selected for an interview.</p>

    <p>
        <strong>Date:</strong> {{ $interviewDate }}<br>
        <strong>Time:</strong> {{ $interviewTime }}<br>
        <strong>Location:</strong> {{ $application->interview_location }}
    </p>

    <p>Please confirm your attendance.</p>

    <p>Best regards,<br>HR Team</p>
</body>
</html>

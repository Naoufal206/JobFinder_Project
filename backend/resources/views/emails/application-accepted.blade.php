<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Job Application Accepted</title>
</head>
<body style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
    <p>Hello {{ $application->full_name }},</p>

    <p>Congratulations! We are happy to let you know that you have been accepted for the position.</p>

    <p>
        <strong>Start Date:</strong> {{ $startWorkDate }}<br>
        <strong>Start Time:</strong> {{ $startWorkTime }}
    </p>

    <p>Please be ready to start work at the scheduled time. We look forward to having you on the team.</p>

    <p>Best regards,<br>HR Team</p>
</body>
</html>

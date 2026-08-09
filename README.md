# JobFinder — Full-Stack Job Platform

> A full-stack job marketplace that connects job seekers with companies through a structured hiring workflow.

JobFinder is a full-stack web application built to simulate a real-world recruitment platform. Job seekers can discover job opportunities, review job details, submit applications with their CV, track application progress, and receive hiring updates. Companies / HR users can publish and manage job offers, review candidates, schedule interviews, reject or accept applications, and manage the hiring pipeline from a dedicated dashboard.

---

## 🚀 Live Project

**Frontend / Demo:** Add your deployed JobFinder URL here when available.

**GitHub Repository:**  
https://github.com/Naoufal206/JobFinder_Project

> The project is currently being improved and prepared for further deployment and UI enhancements.

---

## ✨ Main Features

### 👤 Job Seeker

- Create an applicant account
- Sign in securely
- Browse available job offers
- View job details, salary, location, description, and requirements
- Submit job applications
- Upload a CV / resume
- Track submitted applications
- Filter applications by status
- View scheduled interviews
- View accepted applications and start-work information
- Manage profile information
- Upload a profile image

### 🏢 HR / Company

- Create an HR / company account
- Sign in to a dedicated workspace
- Create and publish job offers
- Edit and delete job offers
- View applications for each job
- Review candidate CVs
- Filter candidates by application status
- Schedule interviews
- Send interview invitation emails
- Accept candidates
- Send acceptance emails
- Reject candidates
- Set interview and start-work information
- Monitor hiring activity from an admin dashboard

### 🔐 Authentication & Roles

The application supports role-based access for different types of users:

- **Applicant** — searches and applies for jobs
- **HR / Company** — manages jobs and candidates

---

## 🏗️ Architecture

JobFinder follows a separated full-stack architecture:

```text
┌─────────────────────────────┐
│        React Frontend       │
│      UI / UX / Routing      │
└──────────────┬──────────────┘
               │ REST API
               ▼
┌─────────────────────────────┐
│       Laravel Backend       │
│ Controllers / Models / Auth │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│          MySQL              │
│     Application Database    │
└─────────────────────────────┘
```

### Frontend

React is responsible for:

- User interface
- Authentication screens
- Job browsing
- Application forms
- Applicant dashboard
- HR / company dashboard
- Application management
- Profile management

### Backend

Laravel provides:

- RESTful API
- Authentication and authorization
- Job management
- Application management
- Candidate workflow
- Email notifications
- Database communication
- File upload handling

### Database

MySQL stores the application's main data, including:

- Users
- Jobs
- Applications
- Interview information
- Hiring status
- Profile information

---

## 🛠️ Technologies

| Layer | Technologies |
|---|---|
| Frontend | React, JavaScript, CSS |
| Backend | Laravel, PHP |
| API | REST API |
| Database | MySQL |
| Authentication | Laravel Sanctum |
| HTTP Client | Axios |
| Build Tool | Create React App |
| Backend Package Manager | Composer |
| Frontend Package Manager | npm |
| Version Control | Git / GitHub |

---

## 🔄 Hiring Workflow

The application simulates a complete recruitment workflow:

```text
Job Published
     ↓
Candidate Applies
     ↓
Under Review
     ↓
Interview Scheduled
     ↓
Candidate Accepted / Rejected
     ↓
Start Work Information
```

HR users can manage the candidate's status directly from the application management interface.

---


## 📁 Project Structure

```text
JobFinder_Project/
│
├── backend/
│   ├── app/
│   │   ├── Http/
│   │   ├── Mail/
│   │   └── Models/
│   ├── database/
│   │   ├── migrations/
│   │   └── seeders/
│   ├── resources/
│   ├── routes/
│   │   └── api.php
│   ├── tests/
│   ├── composer.json
│   └── artisan
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── Admin.js
│   │   ├── AdminApplications.js
│   │   ├── Applications.js
│   │   ├── ApplyForm.js
│   │   ├── Auth.js
│   │   ├── Jobs.js
│   │   ├── NavBar.js
│   │   └── Profile.js
│   ├── package.json
│   └── package-lock.json
│
├── ListTODO/
│   └── Project improvement notes
│
├── screenshots/
└── README.md
```

---

## ⚙️ Installation

### 1. Clone the repository

```bash
git clone https://github.com/Naoufal206/JobFinder_Project.git
cd JobFinder_Project
```

### 2. Backend setup

```bash
cd backend
composer install
```

Create the environment file:

```bash
cp .env.example .env
```

On Windows PowerShell, you can also copy it manually:

```powershell
Copy-Item .env.example .env
```

Generate the Laravel application key:

```bash
php artisan key:generate
```

Configure your database and other environment variables inside:

```text
backend/.env
```

Then run the migrations:

```bash
php artisan migrate
```

If demo seed data is available and you want to use it:

```bash
php artisan db:seed
```

Start the Laravel development server:

```bash
php artisan serve
```

The API will normally be available at:

```text
http://127.0.0.1:8000
```

### 3. Frontend setup

Open another terminal:

```bash
cd frontend
npm install
npm start
```

The React application will normally open at:

```text
http://localhost:3000
```

### 4. Environment variables

Do **not** commit your real `.env` file or secrets to GitHub.

Use the provided example files as templates:

```text
backend/.env.example
```

Configure the frontend API URL according to your local or production backend.

---

## 🧪 Testing

The Laravel backend contains automated tests for important application functionality.

Run:

```bash
cd backend
php artisan test
```

---

## 🔒 Security Notes

Sensitive files and generated directories are excluded from version control through `.gitignore`, including:

- `.env`
- `vendor/`
- `node_modules/`
- Laravel cache files
- Logs
- Local database files
- Uploaded private files

Never publish production credentials, API keys, email passwords, or database passwords to GitHub.

---

## 📌 Current Status

JobFinder is a functional full-stack project with the main recruitment workflow implemented.

### Implemented

- Authentication
- Role-based access
- Job management
- Job browsing
- Applications
- CV upload
- Application status management
- Interview scheduling
- Acceptance / rejection workflow
- Email notifications
- Applicant profile
- Application tracking
- HR dashboard
- Responsive UI

### Planned Improvements

- UI/UX refinements
- Advanced job search and filtering
- Improved validation and error handling
- More detailed analytics
- Additional company profile functionality
- Production deployment improvements
- Further accessibility and mobile optimization

---

## 🎯 Project Purpose

This project was created as a practical full-stack application to demonstrate the development of a complete recruitment platform, from frontend user experience and REST API integration to database design, authentication, file handling, and hiring workflow management.

It focuses on building a realistic application rather than a simple CRUD demonstration.

---

## 👨‍💻 Author

**Naoufal Sahry**

Full-Stack Web Development Student / Developer

- GitHub: https://github.com/Naoufal206

---

## 📄 License

This project is intended primarily as a portfolio and educational project.

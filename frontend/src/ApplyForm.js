
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "./api";
import "./ApplyForm.css";

function IconLocation() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M12 21C12 21 19 14.5 19 9.5C19 5.91 15.87 3 12 3C8.13 3 5 5.91 5 9.5C5 14.5 12 21 12 21Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="12"
        cy="9.5"
        r="2.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function IconSalary() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M12 2V22"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M16.5 6.5C15.7 5.6 14.2 5 12.5 5C10.01 5 8 6.34 8 8C8 9.66 10.01 11 12.5 11C14.99 11 17 12.34 17 14C17 15.66 14.99 17 12.5 17C10.8 17 9.3 16.4 8.5 15.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ApplyForm() {
  const { jobId } = useParams();

  const [job, setJob] = useState(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [cv, setCv] = useState(null);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [alreadyApplied, setAlreadyApplied] = useState(false);

  /*
   * Load logged-in user's information.
   */
  useEffect(() => {
    const user = JSON.parse(
      localStorage.getItem("user") || "null"
    );

    if (user) {
      setFullName(user.name || "");
      setEmail(user.email || "");
    }
  }, []);

  /*
   * Fetch the selected job from Railway API.
   */
  useEffect(() => {
    const fetchJob = async () => {
      try {
        const res = await api.get("/api/jobs");

        const jobsData = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.data)
          ? res.data.data
          : [];

        const selectedJob = jobsData.find(
          (item) => String(item.id) === String(jobId)
        );

        setJob(selectedJob || null);
      } catch (err) {
        console.error("Error fetching job:", err);
        setJob(null);
      }
    };

    fetchJob();
  }, [jobId]);

  /*
   * Check whether the current user already applied
   * for this specific job.
   */
  useEffect(() => {
    const fetchApplicationStatus = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setAlreadyApplied(false);
        return;
      }

      try {
        const res = await api.get("/api/applications", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const applications = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.data)
          ? res.data.data
          : [];

        const hasApplied = applications.some(
          (application) =>
            String(application.job_id) === String(jobId)
        );

        setAlreadyApplied(hasApplied);
      } catch (err) {
        console.error(
          "Error checking application status:",
          err
        );

        setAlreadyApplied(false);
      }
    };

    fetchApplicationStatus();
  }, [jobId]);

  /*
   * Job highlights.
   */
  const jobHighlights = useMemo(() => {
    if (!job) {
      return [
        "Estimated time: 2 minutes",
        "Resume upload supported",
        "Status updates sent by email",
      ];
    }

    const items = [
      "Estimated time: 2 minutes",
      job.location
        ? `Location: ${job.location}`
        : null,
      job.salary
        ? `Salary: ${job.salary}`
        : "Salary shared during review",
    ]
      .filter(Boolean)
      .slice(0, 3);

    return items;
  }, [job]);

  /*
   * Submit application.
   *
   * IMPORTANT:
   * We use api.post() instead of axios.post().
   * api.js contains the Railway production URL.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setMessageType("");

    if (alreadyApplied) {
      setMessage(
        "You have already applied for this job."
      );
      setMessageType("error");
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      setMessage(
        "Please sign in before submitting an application."
      );
      setMessageType("error");
      return;
    }

    if (!jobId) {
      setMessage("Job ID is missing.");
      setMessageType("error");
      return;
    }

    setSubmitting(true);

    const formData = new FormData();

    formData.append("job_id", jobId);
    formData.append("full_name", fullName);
    formData.append("email", email);

    if (cv) {
      formData.append("cv", cv);
    }

    try {
      const response = await api.post(
        "/api/apply-job",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log(
        "Application submitted:",
        response.data
      );

      setMessage(
        response.data?.message ||
          "Application submitted successfully. We will email you when the hiring team updates your status."
      );

      setMessageType("success");

      setAlreadyApplied(true);
      setCv(null);
    } catch (err) {
      console.error(
        "Application submission error:",
        err
      );

      setMessage(
        err.response?.data?.message ||
          err.message ||
          "Error submitting application."
      );

      setMessageType("error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="apply-page">
      <section className="apply-hero">
        <div>
          <p className="apply-kicker">
            Application
          </p>

          <h1>
            Submit a complete application
            with confidence
          </h1>

          <p className="apply-subtitle">
            Review the role details, upload your
            resume, and send your profile to the
            hiring team in a clean, guided flow.
          </p>
        </div>
      </section>

      <section className="apply-layout">
        <aside className="apply-job-panel">
          <div className="apply-job-panel-header">
            <p className="apply-job-summary-label">
              Selected role
            </p>

            <h2>
              {job?.title ||
                "Loading role details"}
            </h2>

            <p className="apply-job-support">
              {job?.company ||
                "Company not specified"}
            </p>

            <p className="apply-job-support">
              Your information is shared only with
              the hiring team reviewing this role.
            </p>
          </div>

          <div className="apply-job-meta">
            <span className="apply-job-meta-item">
              <span className="apply-job-meta-icon">
                <IconLocation />
              </span>

              <span>
                {job?.location ||
                  "Location not specified"}
              </span>
            </span>

            <span className="apply-job-meta-item apply-job-meta-item-accent">
              <span className="apply-job-meta-icon">
                <IconSalary />
              </span>

              <span>
                {job?.salary ||
                  "Salary not specified"}
              </span>
            </span>
          </div>

          <div className="apply-highlights">
            {jobHighlights.map((item) => (
              <div
                key={item}
                className="apply-highlight-item"
              >
                {item}
              </div>
            ))}
          </div>

          <div className="apply-job-detail-card">
            <strong>Description</strong>

            <p>
              {job?.description ||
                "Role details are loading."}
            </p>
          </div>

          <div className="apply-job-detail-card">
            <strong>Requirements</strong>

            <p>
              {job?.requirements ||
                "Requirements will be confirmed during the next hiring step."}
            </p>
          </div>
        </aside>

        <section className="apply-card">
          <div className="apply-card-header">
            <div>
              <p className="apply-card-label">
                Candidate details
              </p>

              <h2>
                Complete your application
              </h2>
            </div>

            <div className="apply-card-meta">
              <span>Fast to complete</span>

              <strong>~2 minutes</strong>
            </div>
          </div>

          {message && (
            <div
              className={`apply-message apply-message-${
                messageType || "success"
              }`}
            >
              <p>{message}</p>

              {messageType === "success" && (
                <Link
                  to="/applications"
                  className="apply-message-link"
                >
                  View my applications
                </Link>
              )}
            </div>
          )}

          <form
            className="apply-form"
            onSubmit={handleSubmit}
          >
            <div className="apply-field">
              <label htmlFor="apply-full-name">
                Full name
              </label>

              <input
                id="apply-full-name"
                type="text"
                placeholder="Your full name"
                value={fullName}
                onChange={(e) =>
                  setFullName(e.target.value)
                }
                required
                disabled={submitting}
              />

              <p className="apply-field-help">
                Use the name you want the hiring
                team to see on your application.
              </p>
            </div>

            <div className="apply-field">
              <label htmlFor="apply-email">
                Email address
              </label>

              <input
                id="apply-email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                required
                disabled={submitting}
              />

              <p className="apply-field-help">
                Status updates and interview
                invitations will be sent to this
                address.
              </p>
            </div>

            <div className="apply-field">
              <label htmlFor="apply-cv">
                Resume / CV
              </label>

              <div className="apply-upload">
                <input
                  id="apply-cv"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) =>
                    setCv(
                      e.target.files?.[0] || null
                    )
                  }
                  disabled={submitting}
                />

                <p>
                  {cv
                    ? cv.name
                    : "Upload PDF, DOC, or DOCX up to 2 MB"}
                </p>
              </div>
            </div>

            <div className="apply-submit-panel">
              <div className="apply-submit-note">
                <strong>Before you send</strong>

                <span>
                  Double-check your email and attach
                  the most recent version of your
                  resume.
                </span>
              </div>

              <button
                type="submit"
                className="apply-submit"
                disabled={
                  submitting || alreadyApplied
                }
              >
                {submitting
                  ? "Submitting..."
                  : alreadyApplied
                  ? "Already applied"
                  : "Submit application"}
              </button>
            </div>
          </form>
        </section>
      </section>
    </div>
  );
}

export default ApplyForm;


import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link, useParams } from "react-router-dom";
import "./ApplyForm.css";

function IconLocation() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 21s-6-5.33-6-11a6 6 0 1 1 12 0c0 5.67-6 11-6 11Zm0-8.5A2.5 2.5 0 1 0 12 7a2.5 2.5 0 0 0 0 5.5Z" />
    </svg>
  );
}

function IconSalary() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3c-3.87 0-7 2.02-7 4.5S8.13 12 12 12s7-2.02 7-4.5S15.87 3 12 3Zm0 10c-3.87 0-7 2.02-7 4.5S8.13 22 12 22s7-2.02 7-4.5S15.87 13 12 13Zm0-8c2.86 0 5 .99 5 2.5S14.86 10 12 10 7 9.01 7 7.5 9.14 5 12 5Zm0 10c2.86 0 5 .99 5 2.5S14.86 20 12 20 7 19.01 7 17.5 9.14 15 12 15Z" />
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

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "null");

    if (user) {
      setFullName(user.name || "");
      setEmail(user.email || "");
    }
  }, []);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const res = await axios.get("/api/jobs");
        const selectedJob = res.data.find((item) => String(item.id) === String(jobId));
        setJob(selectedJob || null);
      } catch (err) {
        setJob(null);
      }
    };

    fetchJob();
  }, [jobId]);

  const jobHighlights = useMemo(() => {
    if (!job) {
      return ["Estimated time: 2 minutes", "Resume upload supported", "Status updates sent by email"];
    }

    const items = [`Estimated time: 2 minutes`, job.location ? `Location: ${job.location}` : null, job.salary ? `Salary: ${job.salary}` : "Salary shared during review"]
      .filter(Boolean)
      .slice(0, 3);

    return items;
  }, [job]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setMessageType("");
    setSubmitting(true);

    const formData = new FormData();
    formData.append("job_id", jobId);
    formData.append("full_name", fullName);
    formData.append("email", email);
    if (cv) {
      formData.append("cv", cv);
    }

    try {
      await axios.post("/api/apply-job", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      setMessage("Application submitted successfully. We will email you when the hiring team updates your status.");
      setMessageType("success");
      setCv(null);
    } catch (err) {
      setMessage(`Error submitting application: ${err.response?.data?.message || err.message}`);
      setMessageType("error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="apply-page">
      <section className="apply-hero">
        <p className="apply-kicker">Application</p>
        <h1>Submit a complete application with confidence</h1>
        <p className="apply-subtitle">
          Review the role details, upload your resume, and send your profile to the hiring team in a clean, guided flow.
        </p>
      </section>

      <section className="apply-layout">
        <aside className="apply-job-panel">
          <div className="apply-job-panel-header">
            <p className="apply-job-summary-label">Selected role</p>
            <h2>{job?.title || "Loading role details"}</h2>
            <p className="apply-job-support">
              {job?.company || "Company not specified"}
            </p>
            <p className="apply-job-support">
              Your information is shared only with the hiring team reviewing this role.
            </p>
          </div>

          <div className="apply-job-meta">
            <span className="apply-job-meta-item">
              <span className="apply-job-meta-icon"><IconLocation /></span>
              <span>{job?.location || "Location not specified"}</span>
            </span>
            <span className="apply-job-meta-item apply-job-meta-item-accent">
              <span className="apply-job-meta-icon"><IconSalary /></span>
              <span>{job?.salary || "Salary not specified"}</span>
            </span>
          </div>

          <div className="apply-highlights">
            {jobHighlights.map((item) => (
              <div key={item} className="apply-highlight-item">
                {item}
              </div>
            ))}
          </div>

          <div className="apply-job-detail-card">
            <strong>Description</strong>
            <p>{job?.description || "Role details are loading."}</p>
          </div>

          <div className="apply-job-detail-card">
            <strong>Requirements</strong>
            <p>{job?.requirements || "Requirements will be confirmed during the next hiring step."}</p>
          </div>
        </aside>

        <section className="apply-card">
          <div className="apply-card-header">
            <div>
              <p className="apply-card-label">Candidate details</p>
              <h2>Complete your application</h2>
            </div>
            <div className="apply-card-meta">
              <span>Fast to complete</span>
              <strong>~2 minutes</strong>
            </div>
          </div>

          {message && (
            <div className={`apply-message apply-message-${messageType || "success"}`}>
              <p>{message}</p>
              {messageType === "success" && (
                <Link to="/applications" className="apply-message-link">
                  View my applications
                </Link>
              )}
            </div>
          )}

          <form className="apply-form" onSubmit={handleSubmit}>
            <div className="apply-field">
              <label htmlFor="apply-full-name">Full name</label>
              <input
                id="apply-full-name"
                type="text"
                placeholder="Your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={submitting}
              />
              <p className="apply-field-help">Use the name you want the hiring team to see on your application.</p>
            </div>

            <div className="apply-field">
              <label htmlFor="apply-email">Email address</label>
              <input
                id="apply-email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={submitting}
              />
              <p className="apply-field-help">Status updates and interview invitations will be sent to this address.</p>
            </div>

            <div className="apply-field">
              <label htmlFor="apply-cv">Resume / CV</label>
              <div className="apply-upload">
                <input
                  id="apply-cv"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setCv(e.target.files?.[0] || null)}
                  disabled={submitting}
                />
                <p>{cv ? cv.name : "Upload PDF, DOC, or DOCX up to 2 MB"}</p>
              </div>
            </div>

            <div className="apply-submit-panel">
              <div className="apply-submit-note">
                <strong>Before you send</strong>
                <span>Double-check your email and attach the most recent version of your resume.</span>
              </div>

              <button type="submit" className="apply-submit" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit application"}
              </button>
            </div>
          </form>
        </section>
      </section>
    </div>
  );
}

export default ApplyForm;

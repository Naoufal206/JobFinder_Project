import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import "./Admin.css";
import "./AdminApplications.css";

const filterOptions = [
  { value: "all", label: "All statuses" },
  { value: "under review", label: "Under Review" },
  { value: "interview scheduled", label: "Interview Scheduled" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
];

const formatStatusLabel = (status) => {
  if (!status) return "Under Review";
  if (status === "Interview Scheduled") return status;

  return String(status)
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const getStatusClassName = (status) => {
  const normalizedStatus = String(status || "under review")
    .toLowerCase()
    .replace(/\s+/g, "-");

  return `admin-status-badge status-${normalizedStatus}`;
};

function IconBackArrow() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M10.79 5.29a1 1 0 0 1 0 1.41L6.5 11H20a1 1 0 1 1 0 2H6.5l4.29 4.29a1 1 0 1 1-1.41 1.41l-6-6a1 1 0 0 1 0-1.41l6-6a1 1 0 0 1 1.41 0Z" />
    </svg>
  );
}

function AdminApplications() {
  const { jobId } = useParams();
  const token = localStorage.getItem("token");
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [statusLoadingId, setStatusLoadingId] = useState(null);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [acceptModalOpen, setAcceptModalOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [previewCvUrl, setPreviewCvUrl] = useState("");
  const [interviewDate, setInterviewDate] = useState("");
  const [interviewTime, setInterviewTime] = useState("");
  const [interviewLocation, setInterviewLocation] = useState("");
  const [startWorkDate, setStartWorkDate] = useState("");
  const [startWorkTime, setStartWorkTime] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [cvLoadingId, setCvLoadingId] = useState(null);

  const fetchJob = useCallback(async () => {
    setLoading(true);

    try {
      const res = await axios.get(`/api/admin/jobs/${jobId}/applications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setJob(res.data);
      setMessage("");
      setMessageType("");
    } catch (err) {
      setMessage(err.response?.data?.message || "Unable to load applications for this job.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }, [jobId, token]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  const filteredApplications = useMemo(() => {
    const applications = job?.applications || [];

    if (statusFilter === "all") {
      return applications;
    }

    return applications.filter((application) => (application.status || "").toLowerCase() === statusFilter);
  }, [job?.applications, statusFilter]);

  const getNormalizedStatus = (status) => String(status || "under review").toLowerCase();

  const fetchCvBlobUrl = useCallback(
    async (applicationId) => {
      const response = await axios.get(`/api/admin/applications/${applicationId}/cv`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      });

      return URL.createObjectURL(response.data);
    },
    [token]
  );

  const handleOpenCv = useCallback(
    async (applicationId) => {
      setCvLoadingId(applicationId);
      setMessage("");
      setMessageType("");

      try {
        const blobUrl = await fetchCvBlobUrl(applicationId);
        window.open(blobUrl, "_blank", "noopener,noreferrer");

        window.setTimeout(() => {
          URL.revokeObjectURL(blobUrl);
        }, 60000);
      } catch (err) {
        setMessage(err.response?.data?.message || "Unable to open this resume right now.");
        setMessageType("error");
      } finally {
        setCvLoadingId(null);
      }
    },
    [fetchCvBlobUrl]
  );

  const handlePreviewCv = useCallback(
    async (applicationId) => {
      setCvLoadingId(applicationId);
      setMessage("");
      setMessageType("");

      try {
        const blobUrl = await fetchCvBlobUrl(applicationId);
        setPreviewCvUrl((currentUrl) => {
          if (currentUrl) {
            URL.revokeObjectURL(currentUrl);
          }

          return blobUrl;
        });
      } catch (err) {
        setMessage(err.response?.data?.message || "Unable to preview this resume right now.");
        setMessageType("error");
      } finally {
        setCvLoadingId(null);
      }
    },
    [fetchCvBlobUrl]
  );

  const openScheduleModal = (application) => {
    const interviewDateTime = application.interview_datetime ? new Date(application.interview_datetime) : null;

    setSelectedApplication(application);
    setInterviewDate(
      interviewDateTime && !Number.isNaN(interviewDateTime.getTime())
        ? interviewDateTime.toISOString().slice(0, 10)
        : ""
    );
    setInterviewTime(
      interviewDateTime && !Number.isNaN(interviewDateTime.getTime())
        ? interviewDateTime.toTimeString().slice(0, 5)
        : ""
    );
    setInterviewLocation(application.interview_location || "");
    setScheduleModalOpen(true);
  };

  const openAcceptModal = (application) => {
    const startWorkDateTime = application.start_work_datetime ? new Date(application.start_work_datetime) : null;

    setSelectedApplication(application);
    setStartWorkDate(
      startWorkDateTime && !Number.isNaN(startWorkDateTime.getTime())
        ? startWorkDateTime.toISOString().slice(0, 10)
        : ""
    );
    setStartWorkTime(
      startWorkDateTime && !Number.isNaN(startWorkDateTime.getTime())
        ? startWorkDateTime.toTimeString().slice(0, 5)
        : ""
    );
    setAcceptModalOpen(true);
  };

  const closeScheduleModal = () => {
    setScheduleModalOpen(false);
    setSelectedApplication(null);
    setInterviewDate("");
    setInterviewTime("");
    setInterviewLocation("");
  };

  const closeAcceptModal = () => {
    setAcceptModalOpen(false);
    setSelectedApplication(null);
    setStartWorkDate("");
    setStartWorkTime("");
  };

  const closePreviewModal = () => {
    setPreviewCvUrl((currentUrl) => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }

      return "";
    });
  };

  const handleStatusChange = async (applicationId, status) => {
    setStatusLoadingId(applicationId);
    setMessage("");

    try {
      await axios.patch(
        `/api/admin/applications/${applicationId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage("Application status updated successfully.");
      setMessageType("success");
      fetchJob();
    } catch (err) {
      setMessage(`Error updating application status: ${err.response?.data?.message || err.message}`);
      setMessageType("error");
    } finally {
      setStatusLoadingId(null);
    }
  };

  const handleScheduleInterview = async (e) => {
    e.preventDefault();

    if (!selectedApplication) return;

    setStatusLoadingId(selectedApplication.id);
    setMessage("");

    try {
      const res = await axios.post(
        `/api/admin/applications/${selectedApplication.id}/schedule-interview`,
        {
          interview_date: interviewDate,
          interview_time: interviewTime,
          interview_location: interviewLocation,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage(res.data?.message || "Interview scheduled successfully.");
      setMessageType(res.data?.success === false ? "error" : "success");
      closeScheduleModal();
      fetchJob();
    } catch (err) {
      setMessage(`Error scheduling interview: ${err.response?.data?.message || err.message}`);
      setMessageType("error");
    } finally {
      setStatusLoadingId(null);
    }
  };

  const handleAcceptApplication = async (e) => {
    e.preventDefault();

    if (!selectedApplication) return;

    setStatusLoadingId(selectedApplication.id);
    setMessage("");

    try {
      const res = await axios.post(
        `/api/admin/applications/${selectedApplication.id}/accept`,
        {
          start_work_date: startWorkDate,
          start_work_time: startWorkTime,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage(res.data?.message || "Candidate accepted successfully.");
      setMessageType(res.data?.success === false ? "error" : "success");
      closeAcceptModal();
      fetchJob();
    } catch (err) {
      setMessage(`Error accepting candidate: ${err.response?.data?.message || err.message}`);
      setMessageType("error");
    } finally {
      setStatusLoadingId(null);
    }
  };

  return (
    <div className="admin-page admin-applications-page">
      <section className="admin-hero admin-applications-hero">
        <p className="admin-kicker">Applications</p>
        <h1>{job?.title || "Loading applications"}</h1>
        <p className="admin-subtitle">
          Review applicants in a dedicated workspace, filter by decision status, and schedule interviews without leaving the flow.
        </p>
        <div className="admin-applications-toolbar">
          <Link to="/admin" className="admin-toolbar-button" aria-label="Back to dashboard">
            <span className="admin-toolbar-button-icon">
              <IconBackArrow />
            </span>
            <span className="admin-toolbar-button-copy">
              <span className="admin-toolbar-button-label">Back to dashboard</span>
              <span className="admin-toolbar-button-caption">Return to all job postings</span>
            </span>
          </Link>
          <div className="admin-filter-field" role="group" aria-label="Application status filters">
            {filterOptions.map((status) => (
              <button
                key={status.value}
                type="button"
                className={`admin-applications-filter-chip${
                  statusFilter === status.value ? " is-active" : ""
                }`}
                onClick={() => setStatusFilter(status.value)}
              >
                {status.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {message && (
        <div className={`admin-message admin-message-${messageType || "success"}`}>
          {message}
        </div>
      )}

      <section className="admin-panel admin-applications-panel">
        <div className="admin-jobs-header">
          <div>
            <p className="admin-panel-label">Applicants</p>
            <h2>{filteredApplications.length} {filteredApplications.length === 1 ? "application" : "applications"}</h2>
          </div>
          <p className="admin-count">{job?.applications_count || 0} total</p>
        </div>

        {loading ? (
          <div className="admin-empty">
            <p>Loading applications...</p>
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="admin-empty">
            <p>No applications match this filter yet.</p>
          </div>
        ) : (
          <div className="admin-applications-grid">
            {filteredApplications.map((application) => (
              <article key={application.id} className="admin-application-card">
                <div className="admin-application-card-header">
                  <div>
                    <p className="admin-application-card-label">Applicant</p>
                    <h3>{application.full_name || "Placeholder applicant"}</h3>
                    <a className="admin-application-card-email" href={`mailto:${application.email || ""}`}>
                      {application.email || "placeholder@email.com"}
                    </a>
                  </div>
                  <span className={getStatusClassName(application.status)}>
                    {formatStatusLabel(application.status)}
                  </span>
                </div>

                <div className="admin-application-card-meta">
                  <div className="admin-application-meta-item">
                    <span className="admin-application-meta-label">Applied</span>
                    <span>{application.created_at ? new Date(application.created_at).toLocaleDateString() : "N/A"}</span>
                  </div>

                  <div className="admin-application-meta-item">
                    <span className="admin-application-meta-label">Resume</span>
                    {application.cv ? (
                      <div className="admin-cv-actions">
                        <button
                          type="button"
                          className="admin-cv-link"
                          onClick={() => handleOpenCv(application.id)}
                          disabled={cvLoadingId === application.id}
                        >
                          Open
                        </button>
                        <button
                          type="button"
                          className="admin-cv-preview"
                          onClick={() => handlePreviewCv(application.id)}
                          disabled={cvLoadingId === application.id}
                        >
                          Preview
                        </button>
                      </div>
                    ) : (
                      <span className="admin-no-cv">No Resume</span>
                    )}
                  </div>
                </div>

                <div className="admin-application-card-section">
                  <span className="admin-application-meta-label">Interview</span>
                  <div className="admin-timeline-cell">
                    {application.interview_datetime ? (
                      <div className="admin-interview-summary">
                        <span>{new Date(application.interview_datetime).toLocaleDateString()}</span>
                        <span>{new Date(application.interview_datetime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        <span className="admin-interview-location">{application.interview_location}</span>
                      </div>
                    ) : (
                      <span className="admin-no-cv">Interview not scheduled</span>
                    )}

                    {application.start_work_datetime ? (
                      <div className="admin-start-summary">
                        <span className="admin-start-label">Start work</span>
                        <span>{new Date(application.start_work_datetime).toLocaleDateString()}</span>
                        <span>{new Date(application.start_work_datetime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="admin-application-card-section">
                  <span className="admin-application-meta-label">Actions</span>
                  <div className="admin-application-actions">
                    {getNormalizedStatus(application.status) === "under review" && (
                      <button
                        type="button"
                        className="admin-primary-button admin-table-button"
                        onClick={() => openScheduleModal(application)}
                        disabled={statusLoadingId === application.id}
                      >
                        Schedule Interview
                      </button>
                    )}

                    {getNormalizedStatus(application.status) === "interview scheduled" && (
                      <button
                        type="button"
                        className="admin-primary-button admin-table-button"
                        onClick={() => openAcceptModal(application)}
                        disabled={statusLoadingId === application.id}
                      >
                        Accept
                      </button>
                    )}
                    <button
                      type="button"
                      className="admin-danger-button admin-table-button"
                      onClick={() => handleStatusChange(application.id, "rejected")}
                      disabled={statusLoadingId === application.id}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {previewCvUrl && (
        <div className="admin-cv-modal" onClick={closePreviewModal}>
          <div className="admin-cv-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="admin-cv-modal-header">
              <div className="admin-cv-modal-title">
                <span>Resume Preview</span>
              </div>
              <button type="button" className="admin-secondary-button admin-cv-close" onClick={closePreviewModal}>
                Close
              </button>
            </div>
            <iframe title="Resume Preview" src={previewCvUrl} className="admin-cv-frame" />
          </div>
        </div>
      )}

      {scheduleModalOpen && selectedApplication && (
        <div className="admin-cv-modal" onClick={closeScheduleModal}>
          <div className="admin-cv-modal-content admin-schedule-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="admin-cv-modal-header">
              <div className="admin-cv-modal-title">
                <span>Schedule Interview</span>
              </div>
              <button type="button" className="admin-secondary-button admin-cv-close" onClick={closeScheduleModal}>
                Close
              </button>
            </div>

            <p className="admin-schedule-subtitle">
              Send an interview invitation to {selectedApplication.full_name} at {selectedApplication.email}.
            </p>

            <form className="admin-form" onSubmit={handleScheduleInterview}>
              <div className="admin-form-row">
                <div className="admin-field">
                  <label htmlFor="interview-date">Interview Date</label>
                  <input id="interview-date" type="date" value={interviewDate} onChange={(e) => setInterviewDate(e.target.value)} required />
                </div>

                <div className="admin-field">
                  <label htmlFor="interview-time">Interview Time</label>
                  <input id="interview-time" type="time" value={interviewTime} onChange={(e) => setInterviewTime(e.target.value)} required />
                </div>
              </div>

              <div className="admin-field">
                <label htmlFor="interview-location">Location or Meeting Link</label>
                <input
                  id="interview-location"
                  type="text"
                  value={interviewLocation}
                  onChange={(e) => setInterviewLocation(e.target.value)}
                  placeholder="Office address or video meeting URL"
                  required
                />
              </div>

              <div className="admin-card-actions">
                <button type="submit" className="admin-primary-button" disabled={statusLoadingId === selectedApplication.id}>
                  Save and Send Email
                </button>
                <button type="button" className="admin-secondary-button" onClick={closeScheduleModal}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {acceptModalOpen && selectedApplication && (
        <div className="admin-cv-modal" onClick={closeAcceptModal}>
          <div className="admin-cv-modal-content admin-schedule-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="admin-cv-modal-header">
              <div className="admin-cv-modal-title">
                <span>Accept Candidate</span>
              </div>
              <button type="button" className="admin-secondary-button admin-cv-close" onClick={closeAcceptModal}>
                Close
              </button>
            </div>

            <p className="admin-schedule-subtitle">
              Send an acceptance email to {selectedApplication.full_name} at {selectedApplication.email} with the start date and time.
            </p>

            <form className="admin-form" onSubmit={handleAcceptApplication}>
              <div className="admin-form-row">
                <div className="admin-field">
                  <label htmlFor="start-work-date">Start Date</label>
                  <input id="start-work-date" type="date" value={startWorkDate} onChange={(e) => setStartWorkDate(e.target.value)} required />
                </div>

                <div className="admin-field">
                  <label htmlFor="start-work-time">Start Time</label>
                  <input id="start-work-time" type="time" value={startWorkTime} onChange={(e) => setStartWorkTime(e.target.value)} required />
                </div>
              </div>

              <div className="admin-card-actions">
                <button type="submit" className="admin-primary-button" disabled={statusLoadingId === selectedApplication.id}>
                  Save and Send Email
                </button>
                <button type="button" className="admin-secondary-button" onClick={closeAcceptModal}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminApplications;

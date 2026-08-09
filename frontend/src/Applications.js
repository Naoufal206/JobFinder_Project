
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "./api";
import "./Applications.css";

const filterOptions = [
  { value: "all", label: "All statuses" },
  { value: "under review", label: "Under Review" },
  { value: "interview scheduled", label: "Interview Scheduled" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
];

function getNormalizedStatus(status) {
  return String(status || "under review").toLowerCase();
}

function getStatusClassName(status) {
  const value = getNormalizedStatus(status);

  if (value === "interview scheduled") {
    return "application-status status-interview-scheduled";
  }

  if (value === "accepted") {
    return "application-status status-accepted";
  }

  if (value === "rejected") {
    return "application-status status-rejected";
  }

  return "application-status status-under-review";
}

function getStatusNote(application) {
  const status = getNormalizedStatus(application.status);

  if (status === "interview scheduled") {
    return "Prepare your resume highlights and watch your email for interview updates.";
  }

  if (status === "accepted") {
    return "Congratulations. Your start date has been shared in the offer update.";
  }

  if (status === "rejected") {
    return "This application is closed. You can still explore other open roles.";
  }

  return "Your application is being reviewed by the hiring team.";
}

function formatDateTime(value) {
  if (!value) {
    return "Not scheduled";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not scheduled";
  }

  return `${date.toLocaleDateString()} at ${date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

function Applications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const navigate = useNavigate();

  const fetchApplications = useCallback(async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/auth?mode=login&redirect=/applications");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await api.get("/api/applications", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("Applications API response:", res.data);

      /*
       * Laravel may return:
       *
       * 1. [...]
       * 2. { data: [...] }
       * 3. { applications: [...] }
       *
       * Make sure applications is ALWAYS an array.
       */
      const applicationsData = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data?.applications)
        ? res.data.applications
        : [];

      setApplications(applicationsData);
    } catch (err) {
      console.error("Applications API error:", err);

      setApplications([]);

      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        navigate("/auth?mode=login&redirect=/applications");
        return;
      }

      setError(
        err.response?.data?.message ||
          "Failed to load applications."
      );
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const stats = useMemo(() => {
    const normalized = applications.map((application) =>
      getNormalizedStatus(application.status)
    );

    return {
      total: applications.length,

      underReview: normalized.filter(
        (status) => status === "under review"
      ).length,

      interviews: normalized.filter(
        (status) => status === "interview scheduled"
      ).length,

      accepted: normalized.filter(
        (status) => status === "accepted"
      ).length,
    };
  }, [applications]);

  const filteredApplications = useMemo(() => {
    if (statusFilter === "all") {
      return applications;
    }

    return applications.filter(
      (application) =>
        getNormalizedStatus(application.status) ===
        statusFilter
    );
  }, [applications, statusFilter]);

  const skeletonItems = Array.from(
    { length: 4 },
    (_, index) => index
  );

  return (
    <div className="applications-page">
      <section className="applications-hero">
        <div>
          <p className="ui-section-kicker">
            Application tracker
          </p>

          <h1>
            Follow every application from review to decision
          </h1>

          <p>
            Check current statuses, interview schedules, and
            hiring updates without digging through email threads.
          </p>
        </div>

        <div className="ui-stat-grid applications-stat-grid">
          <div className="ui-stat-card">
            <span className="ui-stat-label">
              Total applications
            </span>

            <span className="ui-stat-value">
              {stats.total}
            </span>

            <span className="ui-stat-note">
              Everything you have submitted so far
            </span>
          </div>

          <div className="ui-stat-card">
            <span className="ui-stat-label">
              Under review
            </span>

            <span className="ui-stat-value">
              {stats.underReview}
            </span>

            <span className="ui-stat-note">
              Applications waiting on recruiter feedback
            </span>
          </div>

          <div className="ui-stat-card">
            <span className="ui-stat-label">
              Interviews
            </span>

            <span className="ui-stat-value">
              {stats.interviews}
            </span>

            <span className="ui-stat-note">
              Conversations already scheduled
            </span>
          </div>

          <div className="ui-stat-card">
            <span className="ui-stat-label">
              Accepted
            </span>

            <span className="ui-stat-value">
              {stats.accepted}
            </span>

            <span className="ui-stat-note">
              Positive outcomes in your pipeline
            </span>
          </div>
        </div>
      </section>

      {error && (
        <div className="ui-alert ui-alert-error applications-alert">
          {error}
        </div>
      )}

      {!error && (
        <section className="applications-toolbar">
          <div className="ui-filter-row">
            {filterOptions.map((filter) => (
              <button
                key={filter.value}
                type="button"
                className={`ui-filter-chip${
                  statusFilter === filter.value
                    ? " is-active"
                    : ""
                }`}
                onClick={() =>
                  setStatusFilter(filter.value)
                }
              >
                {filter.label}
              </button>
            ))}
          </div>

          <Link
            to="/jobs"
            className="applications-toolbar-link"
          >
            Browse jobs
          </Link>
        </section>
      )}

      {loading ? (
        <section className="applications-list">
          {skeletonItems.map((item) => (
            <article
              key={item}
              className="application-card application-card-skeleton"
            >
              <div className="ui-skeleton application-skeleton-title" />

              <div className="application-skeleton-row">
                <span className="ui-skeleton" />
                <span className="ui-skeleton" />
              </div>

              <div className="application-skeleton-grid">
                <span className="ui-skeleton" />
                <span className="ui-skeleton" />
                <span className="ui-skeleton" />
              </div>

              <div className="ui-skeleton application-skeleton-footer" />
            </article>
          ))}
        </section>
      ) : !error && applications.length === 0 ? (
        <section className="ui-empty-state applications-empty">
          <h2>No applications yet</h2>

          <p>
            You have not applied to any jobs yet. Start
            exploring current openings and submit your first
            application.
          </p>

          <Link
            to="/jobs"
            className="applications-link"
          >
            Browse jobs
          </Link>
        </section>
      ) : !error && filteredApplications.length === 0 ? (
        <section className="ui-empty-state applications-empty">
          <h2>No applications in this status</h2>

          <p>
            Switch filters to review the rest of your hiring
            pipeline.
          </p>
        </section>
      ) : (
        <section className="applications-list">
          {filteredApplications.map((application) => (
            <article
              key={application.id}
              className="application-card"
            >
              <div className="application-card-header">
                <div>
                  <p className="application-card-label">
                    Submitted application
                  </p>

                  <h2>
                    {application.job?.title ||
                      "Job unavailable"}
                  </h2>

                  <p>
                    {application.job?.company ||
                      "Company not specified"}
                  </p>
                </div>

                <span
                  className={getStatusClassName(
                    application.status
                  )}
                >
                  {application.status || "Under Review"}
                </span>
              </div>

              <div className="application-card-details">
                <div className="application-detail">
                  <span>Location</span>

                  <p>
                    {application.job?.location ||
                      "Location not specified"}
                  </p>
                </div>

                <div className="application-detail">
                  <span>Salary</span>

                  <p>
                    {application.job?.salary ||
                      "Salary not specified"}
                  </p>
                </div>

                <div className="application-detail">
                  <span>Applied on</span>

                  <p>
                    {application.created_at
                      ? new Date(
                          application.created_at
                        ).toLocaleDateString()
                      : "Date not available"}
                  </p>
                </div>
              </div>

              <div className="application-progress-panel">
                <div className="application-progress-item">
                  <span>Interview</span>

                  <p>
                    {formatDateTime(
                      application.interview_datetime
                    )}
                  </p>
                </div>

                <div className="application-progress-item">
                  <span>Start date</span>

                  <p>
                    {formatDateTime(
                      application.start_work_datetime
                    )}
                  </p>
                </div>
              </div>

              <div className="application-card-footer">
                <p>
                  {getStatusNote(application)}
                </p>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}

export default Applications;



import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Admin.css";

const API_URL = process.env.REACT_APP_API_URL || "";

const initialJobForm = {
  title: "",
  company: "",
  location: "",
  salary: "",
  description: "",
  requirements: "",
};

const dashboardFilterOptions = [
  { value: "all", label: "All roles" },
  { value: "active", label: "Active hiring" },
  { value: "review", label: "Needs review" },
  { value: "interviews", label: "Interviews" },
  { value: "accepted", label: "Accepted" },
];

/*
 * Laravel API may return:
 *
 * [
 *   {...},
 *   {...}
 * ]
 *
 * OR:
 *
 * {
 *   data: [...]
 * }
 *
 * OR:
 *
 * {
 *   jobs: [...]
 * }
 *
 * This function makes sure we ALWAYS work with an array.
 */
const normalizeJobsResponse = (responseData) => {
  if (Array.isArray(responseData)) {
    return responseData;
  }

  if (Array.isArray(responseData?.data)) {
    return responseData.data;
  }

  if (Array.isArray(responseData?.jobs)) {
    return responseData.jobs;
  }

  if (Array.isArray(responseData?.data?.data)) {
    return responseData.data.data;
  }

  return [];
};

const getApiMessage = (error, fallbackMessage) => {
  const validationErrors = error.response?.data?.errors;

  const firstValidationMessage = validationErrors
    ? Object.values(validationErrors).flat()[0]
    : "";

  return (
    firstValidationMessage ||
    error.response?.data?.message ||
    fallbackMessage
  );
};

const buildJobPayload = (formState) => ({
  title: formState.title.trim(),
  company: formState.company.trim() || null,
  description: formState.description.trim(),
  requirements: formState.requirements.trim() || null,
  location: formState.location.trim() || null,
  salary: formState.salary.trim() || null,
});

const getDisplayDate = (value) => {
  if (!value) {
    return "recently";
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return "recently";
  }

  return parsedDate.toLocaleDateString();
};

const getNormalizedStatus = (status) =>
  String(status || "under review").toLowerCase().trim();

const getJobStage = ({
  applicationsCount,
  underReviewCount,
  interviewCount,
  acceptedCount,
}) => {
  if (acceptedCount > 0) {
    return {
      label: "Offer sent",
      tone: "success",
    };
  }

  if (interviewCount > 0) {
    return {
      label: "Interviewing",
      tone: "primary",
    };
  }

  if (underReviewCount > 0) {
    return {
      label: "Needs review",
      tone: "warning",
    };
  }

  if (applicationsCount > 0) {
    return {
      label: "Active hiring",
      tone: "primary",
    };
  }

  return {
    label: "Published",
    tone: "neutral",
  };
};

function IconLocation() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
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
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v10" />
      <path d="M15 9.5c-.7-.7-1.7-1-3-1-1.7 0-3 .8-3 2s1.3 2 3 2 3 .8 3 2-1.3 2-3 2c-1.3 0-2.3-.3-3-1" />
    </svg>
  );
}

function IconApplicants() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function ExpandableText({
  id,
  title,
  value,
  fallbackText,
  expandedSections,
  onToggle,
  limit = 170,
}) {
  const textValue = (value || "").trim();
  const hasText = Boolean(textValue);
  const shouldCollapse = textValue.length > limit;
  const isExpanded = Boolean(expandedSections[id]);

  const displayText =
    !shouldCollapse || isExpanded
      ? textValue
      : `${textValue.slice(0, limit).trim()}...`;

  return (
    <div className="admin-content-section">
      <span className="admin-content-title">{title}</span>

      <p className="admin-content-text">
        {hasText ? displayText : fallbackText}
      </p>

      {shouldCollapse && (
        <button
          type="button"
          className="admin-text-toggle"
          onClick={() => onToggle(id)}
        >
          {isExpanded ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}

function Admin() {
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");

  const [jobForm, setJobForm] = useState(initialJobForm);
  const [submitting, setSubmitting] = useState(false);

  const [editingJobId, setEditingJobId] = useState(null);
  const [editForm, setEditForm] = useState(initialJobForm);

  const [savingJobId, setSavingJobId] = useState(null);
  const [deletingJobId, setDeletingJobId] = useState(null);

  const [expandedSections, setExpandedSections] = useState({});

  const [jobPanelOpen, setJobPanelOpen] = useState(false);

  const [dashboardFilter, setDashboardFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  /*
   * Fetch admin jobs
   */
  const fetchJobs = useCallback(
    async ({ clearMessage = true } = {}) => {
      if (!token) {
        setJobs([]);
        setMessage("Missing admin session token. Please sign in again.");
        setMessageType("error");
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const response = await axios.get(
          `${API_URL}/api/admin/jobs-with-count`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }
        );

        /*
         * IMPORTANT:
         * Never directly do:
         *
         * setJobs(response.data)
         *
         * because response.data may be an object.
         */
        const normalizedJobs = normalizeJobsResponse(response.data);

        setJobs(normalizedJobs);

        if (clearMessage) {
          setMessage("");
        }
      } catch (error) {
        console.error("Error fetching admin jobs:", error);

        setJobs([]);

        setMessage(
          getApiMessage(
            error,
            "Unable to load your job postings."
          )
        );

        setMessageType("error");
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  /*
   * Calculate information for every job.
   */
  const jobInsights = useMemo(() => {
    /*
     * Safety check:
     * jobs must always be an array.
     */
    if (!Array.isArray(jobs)) {
      return [];
    }

    return jobs.map((job) => {
      const applications = Array.isArray(job.applications)
        ? job.applications
        : [];

      const applicationsCount =
        Number(job.applications_count) ||
        applications.length ||
        0;

      const underReviewCount = applications.filter(
        (application) =>
          getNormalizedStatus(application.status) === "under review"
      ).length;

      const interviewCount = applications.filter(
        (application) =>
          getNormalizedStatus(application.status) ===
          "interview scheduled"
      ).length;

      const acceptedCount = applications.filter(
        (application) =>
          getNormalizedStatus(application.status) === "accepted"
      ).length;

      const rejectedCount = applications.filter(
        (application) =>
          getNormalizedStatus(application.status) === "rejected"
      ).length;

      const stage = getJobStage({
        applicationsCount,
        underReviewCount,
        interviewCount,
        acceptedCount,
      });

      return {
        ...job,

        applicationsCount,
        underReviewCount,
        interviewCount,
        acceptedCount,
        rejectedCount,

        stageLabel: stage.label,
        stageTone: stage.tone,

        lastUpdated: getDisplayDate(
          job.updated_at || job.created_at
        ),

        searchIndex: [
          job.title,
          job.company,
          job.location,
          job.salary,
          job.description,
          job.requirements,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase(),
      };
    });
  }, [jobs]);

  /*
   * Dashboard statistics
   */
  const dashboardStats = useMemo(() => {
    return jobInsights.reduce(
      (summary, job) => {
        summary.totalJobs += 1;
        summary.totalApplications += job.applicationsCount;
        summary.interviews += job.interviewCount;
        summary.accepted += job.acceptedCount;

        summary.rolesWithApplicants +=
          job.applicationsCount > 0 ? 1 : 0;

        summary.waitingReview +=
          job.underReviewCount > 0 ? 1 : 0;

        return summary;
      },
      {
        totalJobs: 0,
        totalApplications: 0,
        interviews: 0,
        accepted: 0,
        rolesWithApplicants: 0,
        waitingReview: 0,
      }
    );
  }, [jobInsights]);

  /*
   * Featured role
   */
  const featuredRole = useMemo(() => {
    return jobInsights.reduce((currentTopRole, job) => {
      if (
        !currentTopRole ||
        job.applicationsCount >
          currentTopRole.applicationsCount
      ) {
        return job;
      }

      return currentTopRole;
    }, null);
  }, [jobInsights]);

  /*
   * Search + filters
   */
  const filteredJobs = useMemo(() => {
    const normalizedSearch = searchQuery
      .trim()
      .toLowerCase();

    return jobInsights.filter((job) => {
      const matchesSearch =
        !normalizedSearch ||
        job.searchIndex.includes(normalizedSearch);

      let matchesFilter = true;

      switch (dashboardFilter) {
        case "active":
          matchesFilter = job.applicationsCount > 0;
          break;

        case "review":
          matchesFilter = job.underReviewCount > 0;
          break;

        case "interviews":
          matchesFilter = job.interviewCount > 0;
          break;

        case "accepted":
          matchesFilter = job.acceptedCount > 0;
          break;

        default:
          matchesFilter = true;
      }

      return matchesSearch && matchesFilter;
    });
  }, [dashboardFilter, jobInsights, searchQuery]);

  /*
   * Form handlers
   */
  const handleCreateFieldChange = (event) => {
    const { name, value } = event.target;

    setJobForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  };

  const handleEditFieldChange = (event) => {
    const { name, value } = event.target;

    setEditForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  };

  /*
   * Open create panel
   */
  const openCreatePanel = () => {
    setEditingJobId(null);
    setEditForm(initialJobForm);
    setJobForm(initialJobForm);
    setJobPanelOpen(true);
  };

  /*
   * Open edit panel
   */
  const openEditPanel = (job) => {
    setEditingJobId(job.id);

    setEditForm({
      title: job.title || "",
      company: job.company || "",
      location: job.location || "",
      salary: job.salary || "",
      description: job.description || "",
      requirements: job.requirements || "",
    });

    setJobPanelOpen(true);
  };

  /*
   * Close drawer
   */
  const closeJobPanel = () => {
    setJobPanelOpen(false);
    setEditingJobId(null);
    setEditForm(initialJobForm);
    setJobForm(initialJobForm);
  };

  /*
   * Create job
   */
  const handleCreateJob = async (event) => {
    event.preventDefault();

    if (!token) {
      setMessage("Please sign in again.");
      setMessageType("error");
      return;
    }

    setSubmitting(true);

    try {
      await axios.post(
        `${API_URL}/api/admin/jobs`,
        buildJobPayload(jobForm),
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      setMessage("Job posted successfully.");
      setMessageType("success");

      closeJobPanel();

      await fetchJobs({
        clearMessage: false,
      });
    } catch (error) {
      console.error("Create job error:", error);

      setMessage(
        getApiMessage(
          error,
          "Unable to create the job posting."
        )
      );

      setMessageType("error");
    } finally {
      setSubmitting(false);
    }
  };

  /*
   * Update job
   */
  const handleUpdateJob = async (event, jobId) => {
    event.preventDefault();

    if (!token) {
      setMessage("Please sign in again.");
      setMessageType("error");
      return;
    }

    setSavingJobId(jobId);

    try {
      await axios.put(
        `${API_URL}/api/admin/jobs/${jobId}`,
        buildJobPayload(editForm),
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      setMessage("Job updated successfully.");
      setMessageType("success");

      closeJobPanel();

      await fetchJobs({
        clearMessage: false,
      });
    } catch (error) {
      console.error("Update job error:", error);

      setMessage(
        getApiMessage(
          error,
          "Unable to update the job posting."
        )
      );

      setMessageType("error");
    } finally {
      setSavingJobId(null);
    }
  };

  /*
   * Delete job
   */
  const handleDeleteJob = async (jobId) => {
    const shouldDelete = window.confirm(
      "Delete this job posting? Applications linked to it will also be removed."
    );

    if (!shouldDelete) {
      return;
    }

    if (!token) {
      setMessage("Please sign in again.");
      setMessageType("error");
      return;
    }

    setDeletingJobId(jobId);

    try {
      await axios.delete(
        `${API_URL}/api/admin/jobs/${jobId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (editingJobId === jobId) {
        closeJobPanel();
      }

      setMessage("Job deleted successfully.");
      setMessageType("success");

      await fetchJobs({
        clearMessage: false,
      });
    } catch (error) {
      console.error("Delete job error:", error);

      setMessage(
        getApiMessage(
          error,
          "Unable to delete the job posting."
        )
      );

      setMessageType("error");
    } finally {
      setDeletingJobId(null);
    }
  };

  /*
   * Expand/collapse description
   */
  const toggleExpandedSection = (sectionId) => {
    setExpandedSections((currentSections) => ({
      ...currentSections,
      [sectionId]: !currentSections[sectionId],
    }));
  };

  /*
   * Reset search/filter
   */
  const resetView = () => {
    setSearchQuery("");
    setDashboardFilter("all");
  };

  const isFilteredView =
    dashboardFilter !== "all" ||
    Boolean(searchQuery.trim());

  const activeFormState = editingJobId
    ? editForm
    : jobForm;

  const activeFieldHandler = editingJobId
    ? handleEditFieldChange
    : handleCreateFieldChange;

  return (
    <div className="admin-page">

      {/* HERO */}
      <section className="admin-hero">
        <div className="admin-hero-main">
          <div>
            <p className="admin-panel-label">
              Admin workspace
            </p>

            <h1>Admin dashboard</h1>

            <p className="admin-hero-description">
              Run hiring from one organized workspace.
              Publish roles, track pipeline movement,
              and jump into applications without leaving
              the dashboard.
            </p>
          </div>

          <div className="admin-hero-pills">
            <span className="admin-hero-pill">
              {dashboardStats.totalJobs} live role
              {dashboardStats.totalJobs === 1 ? "" : "s"}
            </span>

            <span className="admin-hero-pill">
              {dashboardStats.waitingReview} role
              {dashboardStats.waitingReview === 1
                ? ""
                : "s"}{" "}
              need review
            </span>

            <span className="admin-hero-pill">
              {dashboardStats.rolesWithApplicants} role
              {dashboardStats.rolesWithApplicants === 1
                ? ""
                : "s"}{" "}
              with applicants
            </span>
          </div>
        </div>

        <aside className="admin-hero-aside">
          <span className="admin-hero-aside-label">
            Hiring focus
          </span>

          <strong>
            {featuredRole
              ? featuredRole.title
              : "Create your first role"}
          </strong>

          <p>
            {featuredRole
              ? `${featuredRole.applicationsCount} applicants are attached to this role. Last updated ${featuredRole.lastUpdated}.`
              : "Open the role panel to publish a new opening and start building your hiring pipeline."}
          </p>

          <div className="admin-hero-actions">
            <button
              type="button"
              className="admin-primary-button"
              onClick={openCreatePanel}
            >
              Create role
            </button>

            <button
              type="button"
              className="admin-secondary-button"
              onClick={() =>
                fetchJobs({
                  clearMessage: false,
                })
              }
              disabled={loading}
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </aside>
      </section>

      {/* MESSAGE */}
      {message && (
        <div
          className={`admin-message admin-message-${messageType}`}
        >
          {message}
        </div>
      )}

      {/* STATS */}
      <div className="ui-stat-grid admin-stat-grid">

        <div className="ui-stat-card">
          <span className="ui-stat-label">
            Published roles
          </span>

          <span className="ui-stat-value">
            {dashboardStats.totalJobs}
          </span>

          <span className="ui-stat-note">
            Job postings currently visible from your
            admin workspace.
          </span>
        </div>

        <div className="ui-stat-card">
          <span className="ui-stat-label">
            Applications
          </span>

          <span className="ui-stat-value">
            {dashboardStats.totalApplications}
          </span>

          <span className="ui-stat-note">
            Candidates now moving through your hiring
            pipeline.
          </span>
        </div>

        <div className="ui-stat-card">
          <span className="ui-stat-label">
            Interviews scheduled
          </span>

          <span className="ui-stat-value">
            {dashboardStats.interviews}
          </span>

          <span className="ui-stat-note">
            Applicants already invited into the next
            conversation.
          </span>
        </div>

        <div className="ui-stat-card">
          <span className="ui-stat-label">
            Accepted candidates
          </span>

          <span className="ui-stat-value">
            {dashboardStats.accepted}
          </span>

          <span className="ui-stat-note">
            Offers sent from your current active roles.
          </span>
        </div>

      </div>

      {/* WORKSPACE */}
      <section className="admin-workspace-card">

        <div className="admin-workspace-header">
          <div>
            <p className="admin-panel-label">
              Role pipeline
            </p>

            <h2>
              Manage published openings
            </h2>

            <p className="admin-count">
              Filter roles, scan pipeline health,
              and jump to applicants in one click.
            </p>
          </div>

          <button
            type="button"
            className="admin-primary-button"
            onClick={openCreatePanel}
          >
            New role
          </button>
        </div>

        {/* SEARCH */}
        <div className="admin-toolbar-grid">

          <label
            className="admin-search-field"
            htmlFor="admin-search-roles"
          >
            <span className="admin-search-label">
              Search roles
            </span>

            <input
              id="admin-search-roles"
              type="search"
              className="ui-inline-input"
              placeholder="Search by title, location, salary, or role details"
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(event.target.value)
              }
            />
          </label>

          {/* FILTERS */}
          <div className="admin-filter-group">
            <span className="admin-search-label">
              Quick filters
            </span>

            <div className="ui-filter-row">
              {dashboardFilterOptions.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  className={`ui-filter-chip${
                    dashboardFilter === filter.value
                      ? " is-active"
                      : ""
                  }`}
                  onClick={() =>
                    setDashboardFilter(filter.value)
                  }
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* RESULTS */}
        <div className="admin-results-bar">
          <p className="admin-results-copy">
            {loading
              ? "Loading roles..."
              : `${filteredJobs.length} ${
                  filteredJobs.length === 1
                    ? "role"
                    : "roles"
                } shown${
                  isFilteredView
                    ? " for the current view"
                    : ""
                }.`}
          </p>

          {isFilteredView && (
            <button
              type="button"
              className="admin-results-reset"
              onClick={resetView}
            >
              Clear search and filters
            </button>
          )}
        </div>

        {/* LOADING */}
        {loading ? (
          <div className="admin-jobs-list">

            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="admin-job-skeleton"
              >
                <div className="admin-job-skeleton-header ui-skeleton" />

                <div className="admin-job-skeleton-meta">
                  <span className="ui-skeleton" />
                  <span className="ui-skeleton" />
                  <span className="ui-skeleton" />
                </div>

                <div className="admin-job-skeleton-grid">
                  <span className="ui-skeleton" />
                  <span className="ui-skeleton" />
                  <span className="ui-skeleton" />
                  <span className="ui-skeleton" />
                </div>
              </div>
            ))}

          </div>

        ) : filteredJobs.length === 0 ? (

          /* EMPTY */
          <div className="ui-empty-state admin-empty-state">

            <h3>
              No roles match this view
            </h3>

            <p>
              {jobs.length === 0
                ? "You have not published any roles yet. Create your first one to start using the dashboard."
                : "Try adjusting the search or switching filters to bring the rest of your openings back into view."}
            </p>

            <div className="admin-empty-actions">

              <button
                type="button"
                className="admin-primary-button"
                onClick={openCreatePanel}
              >
                Create role
              </button>

              {isFilteredView && (
                <button
                  type="button"
                  className="admin-secondary-button"
                  onClick={resetView}
                >
                  Reset view
                </button>
              )}

            </div>

          </div>

        ) : (

          /* JOBS */
          <div className="admin-jobs-list">

            {filteredJobs.map((job) => (

              <article
                key={job.id}
                className="admin-job-card"
              >

                {/* HEADER */}
                <div className="admin-job-card-header">

                  <div className="admin-job-heading">

                    <div className="admin-job-title-row">

                      <h3>
                        {job.title}
                      </h3>

                      <span
                        className={`admin-job-status admin-job-status-${job.stageTone}`}
                      >
                        {job.stageLabel}
                      </span>

                    </div>

                    {job.company && (
                      <p className="admin-job-company">
                        {job.company}
                      </p>
                    )}

                    <p className="admin-job-description">
                      Updated {job.lastUpdated}.{" "}

                      {job.applicationsCount === 0
                        ? "This role is live and waiting for its first applicant."
                        : `${job.underReviewCount} under review, ${job.interviewCount} interview${
                            job.interviewCount === 1
                              ? ""
                              : "s"
                          }, ${job.acceptedCount} accepted.`}
                    </p>

                  </div>

                  <button
                    type="button"
                    className="admin-secondary-button admin-review-toggle"
                    onClick={() =>
                      navigate(
                        `/admin/jobs/${job.id}/applications`
                      )
                    }
                  >
                    View applications
                  </button>

                </div>

                {/* META */}
                <div className="admin-job-meta">

                  <div className="admin-job-meta-item">

                    <span className="admin-job-meta-icon">
                      <IconLocation />
                    </span>

                    <span>
                      {job.location ||
                        "Location not specified"}
                    </span>

                  </div>

                  <div className="admin-job-meta-item">

                    <span className="admin-job-meta-icon">
                      <IconSalary />
                    </span>

                    <span>
                      {job.salary ||
                        "Salary not specified"}
                    </span>

                  </div>

                  <div className="admin-job-meta-item admin-job-meta-item-accent">

                    <span className="admin-job-meta-icon">
                      <IconApplicants />
                    </span>

                    <span>
                      {job.applicationsCount} applicant
                      {job.applicationsCount === 1
                        ? ""
                        : "s"}
                    </span>

                  </div>

                </div>

                {/* HEALTH */}
                <div className="admin-job-health-grid">

                  <div className="admin-job-health-card">
                    <span>Under review</span>
                    <strong>
                      {job.underReviewCount}
                    </strong>
                  </div>

                  <div className="admin-job-health-card">
                    <span>Interviews</span>
                    <strong>
                      {job.interviewCount}
                    </strong>
                  </div>

                  <div className="admin-job-health-card">
                    <span>Accepted</span>
                    <strong>
                      {job.acceptedCount}
                    </strong>
                  </div>

                  <div className="admin-job-health-card">
                    <span>Rejected</span>
                    <strong>
                      {job.rejectedCount}
                    </strong>
                  </div>

                </div>

                {/* CONTENT */}
                <div className="admin-job-content-grid">

                  <ExpandableText
                    id={`${job.id}-description`}
                    title="Description"
                    value={job.description}
                    fallbackText="No description available."
                    expandedSections={expandedSections}
                    onToggle={toggleExpandedSection}
                  />

                  <ExpandableText
                    id={`${job.id}-requirements`}
                    title="Requirements"
                    value={job.requirements}
                    fallbackText="Requirements can be shared during the interview process."
                    expandedSections={expandedSections}
                    onToggle={toggleExpandedSection}
                  />

                </div>

                {/* ACTIONS */}
                <div className="admin-card-actions">

                  <button
                    type="button"
                    className="admin-primary-button"
                    onClick={() =>
                      openEditPanel(job)
                    }
                  >
                    Edit role
                  </button>

                  <button
                    type="button"
                    className="admin-secondary-button"
                    onClick={() =>
                      navigate(
                        `/admin/jobs/${job.id}/applications`
                      )
                    }
                  >
                    Review candidates
                  </button>

                  <button
                    type="button"
                    className="admin-danger-button"
                    onClick={() =>
                      handleDeleteJob(job.id)
                    }
                    disabled={
                      deletingJobId === job.id
                    }
                  >
                    {deletingJobId === job.id
                      ? "Deleting..."
                      : "Delete role"}
                  </button>

                </div>

              </article>

            ))}

          </div>

        )}

      </section>

      {/* CREATE / EDIT DRAWER */}
      {jobPanelOpen && (

        <div
          className="admin-drawer-backdrop"
          onClick={closeJobPanel}
        >

          <aside
            className="admin-drawer"
            onClick={(event) =>
              event.stopPropagation()
            }
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-job-panel-title"
          >

            {/* DRAWER HEADER */}
            <div className="admin-drawer-header">

              <div>

                <p className="admin-panel-label">
                  {editingJobId
                    ? "Edit role"
                    : "Create role"}
                </p>

                <h2 id="admin-job-panel-title">
                  {editingJobId
                    ? "Update this job posting"
                    : "Publish a new job opening"}
                </h2>

                <p className="admin-count">
                  {editingJobId
                    ? "Refresh the job details and keep the dashboard accurate."
                    : "Add the essentials now and refine the role details any time later."}
                </p>

              </div>

              <button
                type="button"
                className="admin-secondary-button admin-drawer-close"
                onClick={closeJobPanel}
              >
                Close
              </button>

            </div>

            {/* FORM */}
            <form
              className="admin-form admin-drawer-form"
              onSubmit={
                editingJobId
                  ? (event) =>
                      handleUpdateJob(
                        event,
                        editingJobId
                      )
                  : handleCreateJob
              }
            >

              <div className="admin-field">

                <label htmlFor="job-title">
                  Job Title
                </label>

                <input
                  id="job-title"
                  name="title"
                  type="text"
                  value={activeFormState.title}
                  onChange={activeFieldHandler}
                  placeholder="Senior Frontend Developer"
                  required
                />

              </div>

              <div className="admin-field">

                <label htmlFor="job-company">
                  Company
                </label>

                <input
                  id="job-company"
                  name="company"
                  type="text"
                  value={activeFormState.company}
                  onChange={activeFieldHandler}
                  placeholder="Atlas Digital Solutions"
                />

              </div>

              <div className="admin-form-row">

                <div className="admin-field">

                  <label htmlFor="job-location">
                    Location
                  </label>

                  <input
                    id="job-location"
                    name="location"
                    type="text"
                    value={activeFormState.location}
                    onChange={activeFieldHandler}
                    placeholder="Remote or Casablanca"
                  />

                </div>

                <div className="admin-field">

                  <label htmlFor="job-salary">
                    Salary
                  </label>

                  <input
                    id="job-salary"
                    name="salary"
                    type="text"
                    value={activeFormState.salary}
                    onChange={activeFieldHandler}
                    placeholder="$2500 / month"
                  />

                </div>

              </div>

              <div className="admin-field">

                <label htmlFor="job-description">
                  Description
                </label>

                <textarea
                  id="job-description"
                  name="description"
                  value={activeFormState.description}
                  onChange={activeFieldHandler}
                  placeholder="Describe responsibilities, team context, and expected outcomes."
                  required
                />

              </div>

              <div className="admin-field">

                <label htmlFor="job-requirements">
                  Requirements
                </label>

                <textarea
                  id="job-requirements"
                  name="requirements"
                  value={activeFormState.requirements}
                  onChange={activeFieldHandler}
                  placeholder="List skills, tools, or experience expectations."
                />

              </div>

              {/* FORM BUTTONS */}
              <div className="admin-card-actions admin-drawer-actions">

                <button
                  type="submit"
                  className="admin-primary-button"
                  disabled={
                    editingJobId
                      ? savingJobId === editingJobId
                      : submitting
                  }
                >
                  {editingJobId
                    ? savingJobId === editingJobId
                      ? "Saving..."
                      : "Save changes"
                    : submitting
                    ? "Publishing..."
                    : "Publish role"}
                </button>

                <button
                  type="button"
                  className="admin-secondary-button"
                  onClick={closeJobPanel}
                >
                  Cancel
                </button>

              </div>

            </form>

          </aside>

        </div>

      )}

    </div>
  );
}

export default Admin;


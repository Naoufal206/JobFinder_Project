import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Jobs.css";

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

function formatPostedDate(value) {
  if (!value) {
    return "Recently posted";
  }

  const postedAt = new Date(value);
  const now = new Date();
  const diffInDays = Math.max(0, Math.floor((now - postedAt) / (1000 * 60 * 60 * 24)));

  if (diffInDays === 0) {
    return "Posted today";
  }

  if (diffInDays === 1) {
    return "Posted yesterday";
  }

  if (diffInDays < 7) {
    return `Posted ${diffInDays} days ago`;
  }

  return `Posted ${postedAt.toLocaleDateString()}`;
}

function getJobHighlights(job) {
  const rawText = `${job.requirements || ""}\n${job.description || ""}`;

  const extracted = rawText
    .split(/\n|,|\.|;/)
    .map((part) => part.trim())
    .filter((part) => part.length > 2)
    .slice(0, 3);

  if (extracted.length > 0) {
    return extracted;
  }

  return ["Professional environment", "Clear responsibilities", "Career growth"];
}

function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [expandedJobId, setExpandedJobId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setSearchTerm(searchInput.trim().toLowerCase());
    }, 220);

    return () => window.clearTimeout(timeoutId);
  }, [searchInput]);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        const res = await axios.get("/api/jobs");
        setJobs(res.data);
      } catch (err) {
        console.log("Error fetching jobs");
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  const quickFilters = useMemo(() => {
    const locations = [...new Set(jobs.map((job) => job.location?.trim()).filter(Boolean))]
      .slice(0, 3)
      .map((location) => ({
        id: `location:${location}`,
        label: location,
      }));

    return [
      { id: "all", label: "All roles" },
      { id: "salary", label: "With salary" },
      ...locations,
    ];
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchesSearch =
        !searchTerm ||
        [job.title, job.company, job.description, job.requirements, job.location, job.salary]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(searchTerm);

      if (!matchesSearch) {
        return false;
      }

      if (activeFilter === "all") {
        return true;
      }

      if (activeFilter === "salary") {
        return Boolean(job.salary);
      }

      if (activeFilter.startsWith("location:")) {
        return (job.location || "").trim() === activeFilter.replace("location:", "");
      }

      return true;
    });
  }, [activeFilter, jobs, searchTerm]);

  const jobsWithSalary = jobs.filter((job) => job.salary).length;
  const uniqueLocations = new Set(jobs.map((job) => job.location).filter(Boolean)).size;

  const handleApply = (jobId) => {
    const user = JSON.parse(localStorage.getItem("user") || "null");

    if (user?.role === "applicant") {
      navigate(`/apply/${jobId}`);
      return;
    }

    navigate(`/auth?mode=login&redirect=${encodeURIComponent(`/apply/${jobId}`)}`);
  };

  const skeletonItems = Array.from({ length: 6 }, (_, index) => index);

  return (
    <div className="jobs-page">
      <section className="jobs-hero">
        <div className="jobs-hero-copy">
          <p className="jobs-kicker">Career opportunities</p>
          <h1>Find roles that fit your skills and career goals</h1>
          <p className="jobs-subtitle">
            Browse openings, narrow them down with quick filters, and move from discovery to application without friction.
          </p>
        </div>

        <div className="jobs-search-panel">
          <div className="jobs-search">
            <input
              type="text"
              className="jobs-search-input"
              placeholder="Search by title, skill, location, or keyword"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            {searchInput && (
              <button
                type="button"
                className="jobs-search-clear"
                onClick={() => setSearchInput("")}
                aria-label="Clear search"
              >
                Clear
              </button>
            )}
          </div>

          <div className="ui-filter-row jobs-filter-row">
            {quickFilters.map((filter) => (
              <button
                key={filter.id}
                type="button"
                className={`ui-filter-chip${activeFilter === filter.id ? " is-active" : ""}`}
                onClick={() => setActiveFilter(filter.id)}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <p className="jobs-results-count">
            {filteredJobs.length} {filteredJobs.length === 1 ? "role" : "roles"} ready to review
            {searchTerm ? ` for "${searchInput.trim()}"` : ""}
          </p>
        </div>

        <div className="ui-stat-grid jobs-stat-grid">
          <div className="ui-stat-card">
            <span className="ui-stat-label">Open roles</span>
            <span className="ui-stat-value">{jobs.length}</span>
            <span className="ui-stat-note">Across the current hiring pipeline</span>
          </div>
          <div className="ui-stat-card">
            <span className="ui-stat-label">Locations</span>
            <span className="ui-stat-value">{uniqueLocations || 1}</span>
            <span className="ui-stat-note">Flexible for remote and on-site searches</span>
          </div>
          <div className="ui-stat-card">
            <span className="ui-stat-label">Salary listed</span>
            <span className="ui-stat-value">{jobsWithSalary}</span>
            <span className="ui-stat-note">Roles with compensation details visible</span>
          </div>
        </div>
      </section>

      <section className="jobs-list">
        {loading ? (
          skeletonItems.map((item) => (
            <article key={item} className="job-card job-card-skeleton">
              <div className="job-card-skeleton-line ui-skeleton job-card-skeleton-title" />
              <div className="job-card-skeleton-meta">
                <span className="ui-skeleton" />
                <span className="ui-skeleton" />
              </div>
              <div className="job-card-skeleton-block ui-skeleton" />
              <div className="job-card-skeleton-block ui-skeleton" />
              <div className="job-card-skeleton-actions">
                <span className="ui-skeleton" />
                <span className="ui-skeleton" />
              </div>
            </article>
          ))
        ) : jobs.length === 0 ? (
          <div className="ui-empty-state jobs-empty">
            <h2>No roles published yet</h2>
            <p>The hiring team has not published any openings yet. Check back soon for new opportunities.</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="ui-empty-state jobs-empty">
            <h2>No roles match this search</h2>
            <p>Try another keyword or remove the active filter to see more opportunities.</p>
            <button
              type="button"
              className="jobs-empty-button"
              onClick={() => {
                setSearchInput("");
                setActiveFilter("all");
              }}
            >
              Reset filters
            </button>
          </div>
        ) : (
          filteredJobs.map((job) => {
            const isExpanded = expandedJobId === job.id;
            const highlights = getJobHighlights(job);

            return (
              <article key={job.id} className={`job-card${isExpanded ? " is-expanded" : ""}`}>
                <div className="job-card-header">
                  <div className="job-card-header-copy">
                    <p className="job-card-label">Open role</p>
                    <h3>{job.title}</h3>
                    <div className="job-card-company-row">
                      <span className="job-card-company-label">Company</span>
                      <p className="job-card-company">{job.company || "Company not specified"}</p>
                    </div>
                  </div>
                  <span className="job-card-posted">{formatPostedDate(job.created_at)}</span>
                </div>

                <div className="job-card-meta">
                  <span className="job-card-pill">
                    <span className="job-card-pill-icon"><IconLocation /></span>
                    <span>{job.location || "Location not specified"}</span>
                  </span>
                  <span className="job-card-pill job-card-pill-accent">
                    <span className="job-card-pill-icon"><IconSalary /></span>
                    <span>{job.salary || "Salary not specified"}</span>
                  </span>
                </div>

                <p className="job-card-description">
                  {job.description?.length > 165 && !isExpanded
                    ? `${job.description.slice(0, 165)}...`
                    : job.description || "No description available."}
                </p>

                <div className="job-card-tags">
                  {highlights.map((highlight) => (
                    <span key={highlight} className="job-card-tag">
                      {highlight}
                    </span>
                  ))}
                </div>

                {isExpanded && (
                  <div className="job-card-details">
                    <div className="job-card-detail-panel">
                      <span>Description</span>
                      <p>{job.description || "No description available."}</p>
                    </div>
                    <div className="job-card-detail-panel">
                      <span>Requirements</span>
                      <p>{job.requirements || "Requirements will be confirmed during the hiring process."}</p>
                    </div>
                  </div>
                )}

                <div className="job-card-footer">
                  <button type="button" className="job-card-apply" onClick={() => handleApply(job.id)}>
                    Apply now
                  </button>
                  <button
                    type="button"
                    className="job-card-secondary"
                    onClick={() => setExpandedJobId(isExpanded ? null : job.id)}
                  >
                    {isExpanded ? "Hide details" : "View details"}
                  </button>
                </div>
              </article>
            );
          })
        )}
      </section>
    </div>
  );
}

export default Jobs;

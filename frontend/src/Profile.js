import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import "./Profile.css";

const storageBaseUrl = "http://127.0.0.1:8000/storage";

const getAvatarInitial = (user) => {
  const value = user?.name || user?.email || user?.location || "";
  return value.trim().charAt(0).toUpperCase() || "U";
};

function IconCamera() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9 4.5 7.8 6H5.5A2.5 2.5 0 0 0 3 8.5v8A2.5 2.5 0 0 0 5.5 19h13a2.5 2.5 0 0 0 2.5-2.5v-8A2.5 2.5 0 0 0 18.5 6h-2.3L15 4.5H9Zm3 11.25a4.25 4.25 0 1 1 0-8.5 4.25 4.25 0 0 1 0 8.5Zm0-1.8a2.45 2.45 0 1 0 0-4.9 2.45 2.45 0 0 0 0 4.9Z" />
    </svg>
  );
}

function Profile() {
  const [profile, setProfile] = useState(null);
  const [recentApplications, setRecentApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", location: "" });
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const fetchApplicantActivity = useCallback(async (userData, token) => {
    if (userData?.role !== "applicant" || !token) {
      setRecentApplications([]);
      setActivityLoading(false);
      return;
    }

    try {
      setActivityLoading(true);
      const res = await axios.get("/api/applications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRecentApplications(res.data);
    } catch (err) {
      setRecentApplications([]);
    } finally {
      setActivityLoading(false);
    }
  }, []);

  const fetchProfile = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }

    try {
      const res = await axios.get("/api/user", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userData = res.data;
      setProfile(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      setFormData({
        name: userData.name || "",
        email: userData.email || "",
        location: userData.location || "",
      });
      await fetchApplicantActivity(userData, token);
    } catch (err) {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const userData = JSON.parse(userStr);
        setProfile(userData);
        setFormData({
          name: userData.name || "",
          email: userData.email || "",
          location: userData.location || "",
        });
        await fetchApplicantActivity(userData, token);
      } else {
        setActivityLoading(false);
      }
    } finally {
      setLoading(false);
    }
  }, [fetchApplicantActivity, navigate]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = async (e) => {
    e.preventDefault();
    setUploading(true);
    setError("");
    setSuccessMsg("");

    const token = localStorage.getItem("token");
    const data = new FormData();
    data.append("_method", "PUT");
    data.append("name", formData.name);
    data.append("email", formData.email);
    data.append("location", formData.location);

    if (fileInputRef.current?.files[0]) {
      data.append("profile_image", fileInputRef.current.files[0]);
    }

    try {
      const res = await axios.post("/api/profile", data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const updatedUser = res.data.user || res.data;
      setProfile(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      window.dispatchEvent(new Event("user-updated"));
      setEditMode(false);
      setSuccessMsg("Profile updated successfully.");
      setTimeout(() => setSuccessMsg(""), 4000);
      fetchProfile();
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Update failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const resetEditor = () => {
    setEditMode(false);
    setSuccessMsg("");
    setImagePreview(null);
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setFormData({ name: profile?.name || "", email: profile?.email || "", location: profile?.location || "" });
  };

  const completionItems = useMemo(() => {
    const currentProfile = editMode ? formData : profile;

    return [
      { label: "Full name", complete: Boolean(currentProfile?.name?.trim()) },
      { label: "Email address", complete: Boolean(currentProfile?.email?.trim()) },
      { label: "Location", complete: Boolean(currentProfile?.location?.trim()) },
      { label: "Profile photo", complete: Boolean(imagePreview || profile?.profile_image) },
    ];
  }, [editMode, formData, imagePreview, profile]);

  const completionPercentage = Math.round(
    (completionItems.filter((item) => item.complete).length / completionItems.length) * 100
  );

  const applicationStats = useMemo(() => {
    return {
      total: recentApplications.length,
      interviews: recentApplications.filter((application) => String(application.status).toLowerCase() === "interview scheduled").length,
      accepted: recentApplications.filter((application) => String(application.status).toLowerCase() === "accepted").length,
    };
  }, [recentApplications]);

  const nextInterview = useMemo(() => {
    return recentApplications
      .filter((application) => application.interview_datetime)
      .sort((left, right) => new Date(left.interview_datetime) - new Date(right.interview_datetime))[0];
  }, [recentApplications]);

  if (loading) {
    return (
      <div className="profile-loading">
        <p>Loading profile...</p>
      </div>
    );
  }

  const avatarSrc = profile?.profile_image
    ? `${storageBaseUrl}/${String(profile.profile_image).replace(/^\/+/, "")}?t=${Date.now()}`
    : null;
  const avatarInitial = getAvatarInitial(editMode ? formData : profile);

  if (!profile) {
    return (
      <div className="profile-page">
        <section className="profile-empty">
          <h1>My Profile</h1>
          <p>No profile data available right now.</p>
          <Link to="/jobs" className="profile-primary-button">
            Go to Jobs
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <section className="profile-hero">
        <p className="profile-kicker">Account center</p>
        <h1>Keep your profile ready for every hiring step</h1>
        <p className="profile-subtitle">
          Manage your account details, upload a polished profile photo, and keep track of profile readiness from one workspace.
        </p>
      </section>

      <section className="profile-dashboard">
        <section className="profile-main-card">
          <div className="profile-overview">
            <div className="profile-avatar-wrap">
              <button
                type="button"
                className="profile-avatar-button"
                onClick={() => fileInputRef.current?.click()}
                title="Upload new photo"
              >
                {imagePreview || avatarSrc ? (
                  <img
                    src={imagePreview || avatarSrc}
                    alt="Profile avatar"
                    className="profile-avatar-image"
                  />
                ) : (
                  <div className="profile-avatar-fallback" aria-label="Profile avatar">
                    {avatarInitial}
                  </div>
                )}
                <span className="profile-avatar-edit">
                  <IconCamera />
                </span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="profile-file-input"
              />
            </div>

            <div className="profile-overview-copy">
              <p className="profile-pill">{profile.role === "admin" ? "Admin account" : "Applicant account"}</p>
              <h2>{profile.name || "My Profile"}</h2>
              <p className="profile-email">{profile.email}</p>
              <p className="profile-helper">
                {imagePreview
                  ? "Preview ready. Save changes to update your profile photo."
                  : "Use a professional photo so your profile looks complete and trustworthy."}
              </p>
            </div>

            <div className="profile-completion-card">
              <span className="profile-completion-label">Profile completeness</span>
              <strong>{completionPercentage}%</strong>
              <div className="profile-completion-bar" aria-hidden="true">
                <span style={{ width: `${completionPercentage}%` }} />
              </div>
              <p>{completionPercentage === 100 ? "Everything is complete." : "Add the remaining details to strengthen your profile."}</p>
            </div>
          </div>

          {successMsg && <div className="profile-message profile-message-success">{successMsg}</div>}
          {error && <div className="profile-message profile-message-error">{error}</div>}

          <div className="profile-content-grid">
            <div className="profile-section-card">
              <div className="profile-section-header">
                <div>
                  <p className="profile-section-kicker">Personal details</p>
                  <h3>Professional account information</h3>
                </div>
              </div>

              {!editMode ? (
                <>
                  <div className="profile-info-grid">
                    <div className="profile-info-item">
                      <span>Name</span>
                      <p>{profile.name || "Not provided"}</p>
                    </div>
                    <div className="profile-info-item">
                      <span>Email</span>
                      <p>{profile.email || "Not provided"}</p>
                    </div>
                    <div className="profile-info-item">
                      <span>Location</span>
                      <p>{profile.location || "Not provided"}</p>
                    </div>
                  </div>

                  <div className="profile-actions">
                    <button type="button" className="profile-primary-button" onClick={() => setEditMode(true)}>
                      Edit profile
                    </button>
                  </div>
                </>
              ) : (
                <form className="profile-form" onSubmit={updateProfile}>
                  <div className="profile-field">
                    <label htmlFor="profile-name">Name</label>
                    <input
                      id="profile-name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  <div className="profile-field">
                    <label htmlFor="profile-email">Email</label>
                    <input
                      id="profile-email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>

                  <div className="profile-field">
                    <label htmlFor="profile-location">Location</label>
                    <input
                      id="profile-location"
                      type="text"
                      placeholder="e.g. Paris, France"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    />
                  </div>

                  <div className="profile-actions">
                    <button type="submit" className="profile-primary-button" disabled={uploading}>
                      {uploading ? "Saving..." : "Save changes"}
                    </button>
                    <button type="button" className="profile-secondary-button" onClick={resetEditor}>
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>

            <aside className="profile-side-column">
              <div className="profile-section-card">
                <div className="profile-section-header">
                  <div>
                    <p className="profile-section-kicker">Readiness</p>
                    <h3>Completion checklist</h3>
                  </div>
                </div>

                <div className="profile-checklist">
                  {completionItems.map((item) => (
                    <div key={item.label} className={`profile-checklist-item${item.complete ? " is-complete" : ""}`}>
                      <span>{item.label}</span>
                      <strong>{item.complete ? "Done" : "Pending"}</strong>
                    </div>
                  ))}
                </div>
              </div>

              <div className="profile-section-card">
                <div className="profile-section-header">
                  <div>
                    <p className="profile-section-kicker">
                      {profile.role === "applicant" ? "Hiring activity" : "Workspace access"}
                    </p>
                    <h3>{profile.role === "applicant" ? "Recent application overview" : "Admin account overview"}</h3>
                  </div>
                </div>

                {profile.role === "applicant" ? (
                  <>
                    <div className="profile-stats-grid">
                      <div className="profile-stat-card">
                        <span>Applications</span>
                        <strong>{applicationStats.total}</strong>
                      </div>
                      <div className="profile-stat-card">
                        <span>Interviews</span>
                        <strong>{applicationStats.interviews}</strong>
                      </div>
                      <div className="profile-stat-card">
                        <span>Accepted</span>
                        <strong>{applicationStats.accepted}</strong>
                      </div>
                    </div>

                    {nextInterview && (
                      <div className="profile-next-step">
                        <span>Next interview</span>
                        <strong>{nextInterview.job?.title || "Upcoming interview"}</strong>
                        <p>
                          {new Date(nextInterview.interview_datetime).toLocaleDateString()} at{" "}
                          {new Date(nextInterview.interview_datetime).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    )}

                    <div className="profile-activity-list">
                      {activityLoading ? (
                        <p className="profile-activity-placeholder">Loading application activity...</p>
                      ) : recentApplications.length === 0 ? (
                        <p className="profile-activity-placeholder">No applications yet. Start applying to track progress here.</p>
                      ) : (
                        recentApplications.slice(0, 3).map((application) => (
                          <div key={application.id} className="profile-activity-item">
                            <div>
                              <strong>{application.job?.title || "Job unavailable"}</strong>
                              <span>{application.status}</span>
                            </div>
                            <p>{new Date(application.created_at).toLocaleDateString()}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                ) : (
                  <div className="profile-admin-note">
                    <p>Use your account to publish roles, review applications, and send interview or offer updates from the admin dashboard.</p>
                    <Link to="/admin" className="profile-secondary-link">
                      Go to admin dashboard
                    </Link>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </section>
      </section>
    </div>
  );
}

export default Profile;

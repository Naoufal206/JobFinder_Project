import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import "./NavBar.css";

const storageBaseUrl = "http://127.0.0.1:8000/storage";

const getAvatarInitial = (user) => {
  const value = user?.name || user?.email || "";
  return value.trim().charAt(0).toUpperCase() || "U";
};

function NavBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(() => {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  });

  const avatarInitial = getAvatarInitial(user);
  const isAdminSection = location.pathname.startsWith("/admin");
  const avatarSrc = user?.profile_image
    ? `${storageBaseUrl}/${String(user.profile_image).replace(/^\/+/, "")}?t=${Date.now()}`
    : null;

  useEffect(() => {
    const syncUser = () => {
      const userStr = localStorage.getItem("user");
      setUser(userStr ? JSON.parse(userStr) : null);
    };

    window.addEventListener("storage", syncUser);
    window.addEventListener("user-updated", syncUser);

    return () => {
      window.removeEventListener("storage", syncUser);
      window.removeEventListener("user-updated", syncUser);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    window.dispatchEvent(new Event("user-updated"));
    navigate("/");
  };

  return (
    <header className="navbar-shell">
      <nav className="navbar">
        <Link to="/" className="navbar-brand">
          <span className="navbar-brand-mark" aria-hidden="true">
            <span className="navbar-brand-dot" />
            <span className="navbar-brand-bar navbar-brand-bar-short" />
            <span className="navbar-brand-bar navbar-brand-bar-tall" />
          </span>
          <span className="navbar-brand-copy">
            <strong className="navbar-brand-name"><span className="navbar-name">Job</span>Finder</strong>
            <span className="navbar-brand-tagline">Professional hiring platform</span>
          </span>
        </Link>

        <div className="navbar-center">
          <NavLink to="/jobs" className={({ isActive }) => `navbar-link ${isActive || location.pathname === "/" ? "is-active" : ""}`}>
            Browse Jobs
          </NavLink>

          {user?.role === "applicant" && (
            <NavLink to="/applications" className={({ isActive }) => `navbar-link ${isActive ? "is-active" : ""}`}>
              My Applications
            </NavLink>
          )}

          {user?.role === "admin" && (
            <NavLink to="/admin" className={() => `navbar-link ${isAdminSection ? "is-active" : ""}`}>
              Admin Dashboard
            </NavLink>
          )}
        </div>

        <div className="navbar-actions">
          {!user ? (
            <>
              <Link to="/auth?mode=login" className="navbar-button navbar-button-ghost">
                Sign In
              </Link>
              <Link to="/auth?mode=register" className="navbar-button navbar-button-primary">
                Create Account
              </Link>
            </>
          ) : (
            <>
              <button
                type="button"
                className="navbar-profile"
                onClick={() => navigate("/profile")}
                title="Profile"
              >
                {avatarSrc ? (
                  <img src={avatarSrc} alt="Profile" className="navbar-avatar-image" />
                ) : (
                  <span className="navbar-avatar-fallback">{avatarInitial}</span>
                )}
                <span className="navbar-profile-text">
                  <strong>{user?.name || "My profile"}</strong>
                  <span>{user?.role === "admin" ? "Admin account" : "Applicant account"}</span>
                </span>
              </button>

              <button type="button" className="navbar-button navbar-button-danger" onClick={handleLogout}>
                Logout
              </button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}

export default NavBar;

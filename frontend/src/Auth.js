import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import "./Auth.css";

function IconUser() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-4.418 0-8 2.015-8 4.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5C20 16.015 16.418 14 12 14Z" />
    </svg>
  );
}

function IconMail() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5Zm2.2-.5 5.8 4.64L17.8 6Zm11.8 1.28-5.38 4.3a1 1 0 0 1-1.24 0L6 7.28V17.5a.5.5 0 0 0 .5.5h11a.5.5 0 0 0 .5-.5Z" />
    </svg>
  );
}

function IconLock() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M17 10h-1V8a4 4 0 1 0-8 0v2H7a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2Zm-7-2a2 2 0 1 1 4 0v2h-4Zm2 8.75a1.75 1.75 0 1 1 1.75-1.75A1.75 1.75 0 0 1 12 16.75Z" />
    </svg>
  );
}

function IconEye({ open }) {
  return open ? (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 5c5.5 0 9.27 4.6 10.46 6.28a1.18 1.18 0 0 1 0 1.44C21.27 14.4 17.5 19 12 19S2.73 14.4 1.54 12.72a1.18 1.18 0 0 1 0-1.44C2.73 9.6 6.5 5 12 5Zm0 2C8.3 7 5.38 9.78 3.7 12c1.68 2.22 4.6 5 8.3 5s6.62-2.78 8.3-5C18.62 9.78 15.7 7 12 7Zm0 1.75A3.25 3.25 0 1 1 8.75 12 3.25 3.25 0 0 1 12 8.75Z" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m3.28 2.22 18.5 18.5-1.06 1.06-3.04-3.04A12.4 12.4 0 0 1 12 20c-5.62 0-9.46-4.61-10.63-6.29a1.16 1.16 0 0 1 0-1.42A20.52 20.52 0 0 1 6.1 7.48L2.22 3.28Zm4.35 6.47A17.26 17.26 0 0 0 3.55 12c1.66 2.19 4.53 5 8.45 5a9.65 9.65 0 0 0 4.08-.9l-2.09-2.09A3.25 3.25 0 0 1 9.99 10Zm4.14-3.67c5.48.08 9.23 4.61 10.4 6.27a1.16 1.16 0 0 1 0 1.42 20.17 20.17 0 0 1-3.05 3.49l-2.14-2.14A17.28 17.28 0 0 0 20 12c-1.64-2.16-4.47-4.92-8.29-5h-.35l-2.1-2.1A11.1 11.1 0 0 1 11.77 5.02Z" />
    </svg>
  );
}

const roleOptions = [
  {
    value: "applicant",
    title: "Applicant",
    description: "Track applications, interviews, and profile updates in one place.",
  },
  {
    value: "admin",
    title: "HR Company",
    description: "Publish jobs, review candidates, and manage hiring decisions.",
  },
];

function Auth() {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState(searchParams.get("mode") === "login" ? "login" : "register");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("applicant");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const isRegister = mode === "register";

  useEffect(() => {
    const searchMode = searchParams.get("mode");
    if (searchMode === "login" || searchMode === "register") {
      setMode(searchMode);
    }
  }, [searchParams]);

  const resetModeState = () => {
    setMessage("");
    setMessageType("");
    setErrors({});
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const changeMode = (nextMode) => {
    setMode(nextMode);
    resetModeState();
  };

  const validateForm = () => {
    const nextErrors = {};

    if (isRegister && !name.trim()) {
      nextErrors.name = "Please enter your full name.";
    }

    if (!email.trim()) {
      nextErrors.email = "Email is required.";
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!password) {
      nextErrors.password = "Password is required.";
    } else if (password.length < 6) {
      nextErrors.password = "Password must be at least 6 characters.";
    }

    if (isRegister && !confirmPassword) {
      nextErrors.confirmPassword = "Please confirm your password.";
    } else if (isRegister && password !== confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleFieldChange = (field, value, setter) => {
    setter(value);
    if (errors[field]) {
      setErrors((current) => ({ ...current, [field]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setMessage("");
    setMessageType("");

    try {
      const url = isRegister ? "/api/register" : "/api/login";
      const payload = isRegister ? { name, email, password, role } : { email, password };
      const res = await axios.post(url, payload);

      setMessage(res.data.message || (isRegister ? "Account created successfully." : "Signed in successfully."));
      setMessageType("success");

      if (res.data.user) {
        if (res.data.token) {
          localStorage.setItem("token", res.data.token);
        }

        localStorage.setItem("user", JSON.stringify(res.data.user));

        const redirect = searchParams.get("redirect");
        const target = redirect ? decodeURIComponent(redirect) : res.data.user.role === "admin" ? "/admin" : "/jobs";
        window.location.href = target;
      }

      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setErrors({});
    } catch (err) {
      setMessage(err.response?.data?.message || err.message || "Something went wrong.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-backdrop auth-backdrop-one" />
      <div className="auth-backdrop auth-backdrop-two" />

      <div className="auth-shell">
        <div className="auth-card">
          <div className="auth-mode-switch" role="tablist" aria-label="Authentication mode">
            <button
              type="button"
              className={`auth-mode-button${!isRegister ? " is-active" : ""}`}
              onClick={() => changeMode("login")}
            >
              Sign in
            </button>
            <button
              type="button"
              className={`auth-mode-button${isRegister ? " is-active" : ""}`}
              onClick={() => changeMode("register")}
            >
              Create account
            </button>
          </div>

          <div className="auth-header">
            <p className="auth-kicker">{isRegister ? "New workspace" : "Welcome back"}</p>
            <h1>{isRegister ? "Create a professional hiring account" : "Sign in to your workspace"}</h1>
            <p className="auth-subtitle">
              {isRegister
                ? "Set up an account to apply faster, manage your profile, and keep all hiring activity in one place."
                : "Continue to your dashboard, application tracker, and profile settings."}
            </p>
          </div>

          {message && (
            <div className={`auth-message auth-message-${messageType || "success"}`}>
              {message}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {isRegister && (
              <div className="auth-field">
                <label htmlFor="auth-name">Full name</label>
                <div className={`auth-input-wrap ${errors.name ? "is-error" : ""}`}>
                  <span className="auth-icon"><IconUser /></span>
                  <input
                    id="auth-name"
                    type="text"
                    placeholder="Your full name"
                    value={name}
                    onChange={(e) => handleFieldChange("name", e.target.value, setName)}
                    disabled={loading}
                  />
                </div>
                {errors.name && <p className="auth-error">{errors.name}</p>}
              </div>
            )}

            <div className="auth-field">
              <label htmlFor="auth-email">Email</label>
              <div className={`auth-input-wrap ${errors.email ? "is-error" : ""}`}>
                <span className="auth-icon"><IconMail /></span>
                <input
                  id="auth-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => handleFieldChange("email", e.target.value, setEmail)}
                  disabled={loading}
                />
              </div>
              {errors.email && <p className="auth-error">{errors.email}</p>}
            </div>

            <div className="auth-field">
              <label htmlFor="auth-password">Password</label>
              <div className={`auth-input-wrap ${errors.password ? "is-error" : ""}`}>
                <span className="auth-icon"><IconLock /></span>
                <input
                  id="auth-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => handleFieldChange("password", e.target.value, setPassword)}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="auth-visibility"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <IconEye open={showPassword} />
                </button>
              </div>
              {errors.password && <p className="auth-error">{errors.password}</p>}
            </div>

            {isRegister && (
              <>
                <div className="auth-field">
                  <label htmlFor="auth-confirm-password">Confirm password</label>
                  <div className={`auth-input-wrap ${errors.confirmPassword ? "is-error" : ""}`}>
                    <span className="auth-icon"><IconLock /></span>
                    <input
                      id="auth-confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Repeat your password"
                      value={confirmPassword}
                      onChange={(e) => handleFieldChange("confirmPassword", e.target.value, setConfirmPassword)}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="auth-visibility"
                      onClick={() => setShowConfirmPassword((value) => !value)}
                      aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                    >
                      <IconEye open={showConfirmPassword} />
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="auth-error">{errors.confirmPassword}</p>}
                </div>

                <div className="auth-field">
                  <label>Account type</label>
                  <div className="auth-role-grid">
                    {roleOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={`auth-role-card${role === option.value ? " is-active" : ""}`}
                        onClick={() => setRole(option.value)}
                      >
                        <strong>{option.title}</strong>
                        <span>{option.description}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? (
                <span className="auth-submit-loading">
                  <span className="auth-spinner" />
                  <span>{isRegister ? "Creating account..." : "Signing in..."}</span>
                </span>
              ) : (
                <span>{isRegister ? "Create account" : "Sign in"}</span>
              )}
            </button>
          </form>

          <p className="auth-switch">
            {isRegister ? "Already have an account?" : "Need an account?"}{" "}
            <button type="button" onClick={() => changeMode(isRegister ? "login" : "register")}>
              {isRegister ? "Sign in" : "Create account"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Auth;

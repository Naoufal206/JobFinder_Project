import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "./api";
import "./Auth.css";

function IconUser() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function IconMail() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

function IconLock() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function IconEye({ open }) {
  if (open) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m3 3 18 18" />
      <path d="M10.6 5.2A10.8 10.8 0 0 1 12 5c6.5 0 10 7 10 7a17.7 17.7 0 0 1-3.2 4.3" />
      <path d="M6.6 6.6C3.6 8.5 2 12 2 12s3.5 7 10 7a9.8 9.8 0 0 0 3.4-.6" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </svg>
  );
}

const roleOptions = [
  {
    value: "applicant",
    title: "Applicant",
    description:
      "Track applications, interviews, and profile updates in one place.",
  },
  {
    value: "admin",
    title: "HR Company",
    description:
      "Publish jobs, review candidates, and manage hiring decisions.",
  },
];

function Auth() {
  const [searchParams] = useSearchParams();

  const [mode, setMode] = useState(
    searchParams.get("mode") === "login" ? "login" : "register"
  );

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
      setErrors((current) => ({
        ...current,
        [field]: "",
      }));
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
      const endpoint = isRegister
        ? "/api/register"
        : "/api/login";

      const payload = isRegister
        ? {
            name,
            email,
            password,
            role,
          }
        : {
            email,
            password,
          };

      // Uses the Railway API configured in api.js
      const res = await api.post(endpoint, payload);

      setMessage(
        res.data.message ||
          (isRegister
            ? "Account created successfully."
            : "Signed in successfully.")
      );

      setMessageType("success");

      if (res.data.user) {
        if (res.data.token) {
          localStorage.setItem("token", res.data.token);
        }

        localStorage.setItem(
          "user",
          JSON.stringify(res.data.user)
        );

        const redirect = searchParams.get("redirect");

        const target = redirect
          ? decodeURIComponent(redirect)
          : res.data.user.role === "admin"
          ? "/admin"
          : "/jobs";

        window.location.href = target;
      }

      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setErrors({});
    } catch (err) {
      console.error("Authentication error:", err);

      setMessage(
        err.response?.data?.message ||
          err.message ||
          "Something went wrong."
      );

      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <div className="auth-card">
          <div
            className="auth-mode-switch"
            role="tablist"
            aria-label="Authentication mode"
          >
            <button
              type="button"
              className={`auth-mode-button${
                !isRegister ? " is-active" : ""
              }`}
              onClick={() => changeMode("login")}
            >
              Sign in
            </button>

            <button
              type="button"
              className={`auth-mode-button${
                isRegister ? " is-active" : ""
              }`}
              onClick={() => changeMode("register")}
            >
              Create account
            </button>
          </div>

          <div className="auth-header">
            <p className="auth-kicker">
              {isRegister ? "New workspace" : "Welcome back"}
            </p>

            <h1>
              {isRegister
                ? "Create a professional hiring account"
                : "Sign in to your workspace"}
            </h1>

            <p className="auth-subtitle">
              {isRegister
                ? "Set up an account to apply faster, manage your profile, and keep all hiring activity in one place."
                : "Continue to your dashboard, application tracker, and profile settings."}
            </p>
          </div>

          {message && (
            <div
              className={`auth-message auth-message-${
                messageType || "success"
              }`}
            >
              {message}
            </div>
          )}

          <form
            className="auth-form"
            onSubmit={handleSubmit}
            noValidate
          >
            {isRegister && (
              <div className="auth-field">
                <label htmlFor="auth-name">
                  Full name
                </label>

                <div
                  className={`auth-input-wrap ${
                    errors.name ? "is-error" : ""
                  }`}
                >
                  <span className="auth-icon">
                    <IconUser />
                  </span>

                  <input
                    id="auth-name"
                    type="text"
                    placeholder="Your full name"
                    value={name}
                    onChange={(e) =>
                      handleFieldChange(
                        "name",
                        e.target.value,
                        setName
                      )
                    }
                    disabled={loading}
                  />
                </div>

                {errors.name && (
                  <p className="auth-error">
                    {errors.name}
                  </p>
                )}
              </div>
            )}

            <div className="auth-field">
              <label htmlFor="auth-email">
                Email
              </label>

              <div
                className={`auth-input-wrap ${
                  errors.email ? "is-error" : ""
                }`}
              >
                <span className="auth-icon">
                  <IconMail />
                </span>

                <input
                  id="auth-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) =>
                    handleFieldChange(
                      "email",
                      e.target.value,
                      setEmail
                    )
                  }
                  disabled={loading}
                />
              </div>

              {errors.email && (
                <p className="auth-error">
                  {errors.email}
                </p>
              )}
            </div>

            <div className="auth-field">
              <label htmlFor="auth-password">
                Password
              </label>

              <div
                className={`auth-input-wrap ${
                  errors.password ? "is-error" : ""
                }`}
              >
                <span className="auth-icon">
                  <IconLock />
                </span>

                <input
                  id="auth-password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) =>
                    handleFieldChange(
                      "password",
                      e.target.value,
                      setPassword
                    )
                  }
                  disabled={loading}
                />

                <button
                  type="button"
                  className="auth-visibility"
                  onClick={() =>
                    setShowPassword(
                      (value) => !value
                    )
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  <IconEye
                    open={showPassword}
                  />
                </button>
              </div>

              {errors.password && (
                <p className="auth-error">
                  {errors.password}
                </p>
              )}
            </div>

            {isRegister && (
              <>
                <div className="auth-field">
                  <label htmlFor="auth-confirm-password">
                    Confirm password
                  </label>

                  <div
                    className={`auth-input-wrap ${
                      errors.confirmPassword
                        ? "is-error"
                        : ""
                    }`}
                  >
                    <span className="auth-icon">
                      <IconLock />
                    </span>

                    <input
                      id="auth-confirm-password"
                      type={
                        showConfirmPassword
                          ? "text"
                          : "password"
                      }
                      placeholder="Repeat your password"
                      value={confirmPassword}
                      onChange={(e) =>
                        handleFieldChange(
                          "confirmPassword",
                          e.target.value,
                          setConfirmPassword
                        )
                      }
                      disabled={loading}
                    />

                    <button
                      type="button"
                      className="auth-visibility"
                      onClick={() =>
                        setShowConfirmPassword(
                          (value) => !value
                        )
                      }
                      aria-label={
                        showConfirmPassword
                          ? "Hide confirm password"
                          : "Show confirm password"
                      }
                    >
                      <IconEye
                        open={
                          showConfirmPassword
                        }
                      />
                    </button>
                  </div>

                  {errors.confirmPassword && (
                    <p className="auth-error">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>

                <div className="auth-field">
                  <label>Account type</label>

                  <div className="auth-role-grid">
                    {roleOptions.map(
                      (option) => (
                        <button
                          key={option.value}
                          type="button"
                          className={`auth-role-card${
                            role === option.value
                              ? " is-active"
                              : ""
                          }`}
                          onClick={() =>
                            setRole(
                              option.value
                            )
                          }
                          disabled={loading}
                        >
                          <strong>
                            {option.title}
                          </strong>

                          <span>
                            {option.description}
                          </span>
                        </button>
                      )
                    )}
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
            >
              {loading ? (
                <span className="auth-submit-loading">
                  <span className="auth-spinner" />

                  <span>
                    {isRegister
                      ? "Creating account..."
                      : "Signing in..."}
                  </span>
                </span>
              ) : (
                <span>
                  {isRegister
                    ? "Create account"
                    : "Sign in"}
                </span>
              )}
            </button>
          </form>

          <p className="auth-switch">
            {isRegister
              ? "Already have an account?"
              : "Need an account?"}{" "}
            <button
              type="button"
              onClick={() =>
                changeMode(
                  isRegister
                    ? "login"
                    : "register"
                )
              }
            >
              {isRegister
                ? "Sign in"
                : "Create account"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Auth;
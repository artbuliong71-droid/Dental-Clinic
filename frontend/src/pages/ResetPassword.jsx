import { useEffect, useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { forgotPassword, resetPassword } from "../api/authApi";
import { useAuth } from "../context/AuthContext";
import AuthLayout from "../components/AuthLayout";

const RESEND_SECONDS = 60; // same as the server's cooldown

const EyeIcon = ({ off }) => (
  <svg
    viewBox="0 0 24 24"
    width="20"
    height="20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    aria-hidden="true"
  >
    <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
    {off && <path d="M4 4l16 16" />}
  </svg>
);

const validate = ({ code, password, confirm }) => {
  const errors = {};
  if (!/^\d{6}$/.test(code))
    errors.code = "Enter the 6-digit code from your email.";
  if (!password) errors.password = "Password is required.";
  else if (password.length < 8)
    errors.password = "Password must be at least 8 characters.";
  else if (!/[A-Za-z]/.test(password) || !/\d/.test(password))
    errors.password = "Password must include both letters and numbers.";
  if (password && confirm !== password)
    errors.confirm = "Passwords do not match.";
  return errors;
};

const ResetPassword = () => {
  const location = useLocation();
  const { user } = useAuth();
  const email = location.state?.email;

  const [form, setForm] = useState({ code: "", password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_SECONDS); // a code was just requested
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const change = (e) => {
    let { name, value } = e.target;
    if (name === "code") value = value.replace(/\D/g, "").slice(0, 6);
    setForm({ ...form, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");

    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setLoading(true);
    try {
      await resetPassword({ email, code: form.code, password: form.password });
      setDone(true);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not reset the password. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setInfo("");
    setResending(true);
    try {
      await forgotPassword(email);
      setInfo("If that email is registered, a new code was sent.");
      setForm({ ...form, code: "" });
      setCooldown(RESEND_SECONDS);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not send a new code. Please try again.",
      );
    } finally {
      setResending(false);
    }
  };

  // Already logged in, or opened this page directly without an email
  if (user) {
    const home =
      user.role === "admin"
        ? "/admin"
        : user.role === "staff"
          ? "/staff"
          : "/dashboard";
    return <Navigate to={home} replace />;
  }
  if (!email) return <Navigate to="/forgot-password" replace />;

  if (done) {
    return (
      <AuthLayout>
        <h2 className="auth-title">Password Updated</h2>
        <p className="auth-subtitle">
          Your password was changed. You can now log in with your new password.
        </p>
        <Link to="/login" className="btn-primary btn-link">
          Go to Login <span aria-hidden="true">→</span>
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <h2 className="auth-title">Reset Password</h2>
      <p className="auth-subtitle">
        If <strong className="otp-email">{email}</strong> is registered, we sent
        it a 6-digit code. Enter the code and choose a new password.
      </p>

      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}
        {info && (
          <p className="info-message" role="status">
            {info}
          </p>
        )}

        <label htmlFor="code">Verification code</label>
        <div className="input-wrap">
          <input
            id="code"
            name="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            className={`no-icon ${errors.code ? "invalid" : ""}`}
            placeholder="6-digit code"
            value={form.code}
            onChange={change}
            style={{ letterSpacing: "0.35em", fontWeight: 600 }}
            autoFocus
          />
        </div>
        {errors.code && (
          <p className="field-error" role="alert">
            {errors.code}
          </p>
        )}

        <label htmlFor="password">New password</label>
        <div className="input-wrap">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            className={`no-icon ${errors.password ? "invalid" : ""}`}
            placeholder="At least 8 characters, letters and numbers"
            value={form.password}
            onChange={change}
          />
          <button
            type="button"
            className="input-toggle"
            onClick={() => setShowPassword((s) => !s)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            <EyeIcon off={showPassword} />
          </button>
        </div>
        {errors.password && (
          <p className="field-error" role="alert">
            {errors.password}
          </p>
        )}

        <label htmlFor="confirm">Confirm new password</label>
        <div className="input-wrap">
          <input
            id="confirm"
            name="confirm"
            type={showPassword ? "text" : "password"}
            className={`no-icon ${errors.confirm ? "invalid" : ""}`}
            placeholder="Type the new password again"
            value={form.confirm}
            onChange={change}
          />
        </div>
        {errors.confirm && (
          <p className="field-error" role="alert">
            {errors.confirm}
          </p>
        )}

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? (
            "Saving..."
          ) : (
            <>
              Reset password <span aria-hidden="true">→</span>
            </>
          )}
        </button>

        <p className="resend-row">
          Didn't get the code?{" "}
          <button
            type="button"
            className="link-btn"
            onClick={handleResend}
            disabled={cooldown > 0 || resending}
          >
            {resending
              ? "Sending..."
              : cooldown > 0
                ? `Resend in ${cooldown}s`
                : "Resend code"}
          </button>
        </p>

        <p className="auth-switch">
          <Link to="/login">Back to Login</Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default ResetPassword;

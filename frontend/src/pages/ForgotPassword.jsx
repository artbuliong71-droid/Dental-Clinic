import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { forgotPassword } from "../api/authApi";
import { useAuth } from "../context/AuthContext";
import AuthLayout from "../components/AuthLayout";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const clean = email.trim();
    if (!EMAIL_REGEX.test(clean)) {
      return setError("Enter a valid email, like name@example.com.");
    }

    setLoading(true);
    try {
      await forgotPassword(clean);
      // The server gives the same answer for every email, so we always continue
      navigate("/reset-password", { state: { email: clean } });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Already logged in? Go to the dashboard
  if (user) {
    const home =
      user.role === "admin"
        ? "/admin"
        : user.role === "staff"
          ? "/staff"
          : "/dashboard";
    return <Navigate to={home} replace />;
  }

  return (
    <AuthLayout>
      <h2 className="auth-title">Forgot Password?</h2>
      <p className="auth-subtitle">
        Enter your email and we'll send you a 6-digit code to reset your
        password.
      </p>

      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}

        <label htmlFor="email">Email</label>
        <div className="input-wrap">
          <input
            id="email"
            type="email"
            className="no-icon"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
          />
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? (
            "Sending..."
          ) : (
            <>
              Send code <span aria-hidden="true">→</span>
            </>
          )}
        </button>

        <p className="auth-switch">
          Remembered it? <Link to="/login">Back to Login</Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default ForgotPassword;

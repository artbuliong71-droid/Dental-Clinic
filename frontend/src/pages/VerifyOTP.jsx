import { useRef, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { verifyOTP } from "../api/authApi";
import { useAuth } from "../context/AuthContext";
import AuthLayout from "../components/AuthLayout";

const OTP_LENGTH = 6;

const VerifyOTP = () => {
  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(""));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputsRef = useRef([]);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  // The email passed from the Login page
  const email = location.state?.email;
  const otp = digits.join("");

  const focusBox = (i) => inputsRef.current[i]?.focus();

  const handleChange = (i, value) => {
    const digit = value.replace(/\D/g, "").slice(-1); // digits only, keep last typed
    const next = [...digits];
    next[i] = digit;
    setDigits(next);
    if (digit && i < OTP_LENGTH - 1) focusBox(i + 1);
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      focusBox(i - 1);
    } else if (e.key === "ArrowLeft" && i > 0) {
      focusBox(i - 1);
    } else if (e.key === "ArrowRight" && i < OTP_LENGTH - 1) {
      focusBox(i + 1);
    }
  };

  // Paste the whole code at once
  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = Array(OTP_LENGTH).fill("");
    pasted.split("").forEach((d, i) => (next[i] = d));
    setDigits(next);
    focusBox(Math.min(pasted.length, OTP_LENGTH - 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (otp.length < OTP_LENGTH) {
      setError(`Enter the ${OTP_LENGTH}-digit code.`);
      return;
    }

    setLoading(true);

    try {
      const response = await verifyOTP(email, otp);
      // Success! This is the real "login" — save to Context + localStorage
      login(response.data.user, response.data.token);

      // Different dashboard depending on role
      const role = response.data.user.role;
      if (role === "admin") {
        navigate("/admin");
      } else if (role === "staff") {
        navigate("/staff");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Verification failed. Please try again.",
      );
      setDigits(Array(OTP_LENGTH).fill(""));
      focusBox(0);
    } finally {
      setLoading(false);
    }
  };

  // No email (e.g. opened this page directly without logging in)
  if (!email) {
    return (
      <AuthLayout>
        <h2 className="auth-title">Session expired</h2>
        <p className="auth-subtitle">No email provided. Please log in first.</p>
        <Link to="/login" className="btn-primary btn-link">
          Go to Login
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <h2 className="auth-title">Verify Your Identity</h2>
      <p className="auth-subtitle">
        We sent a {OTP_LENGTH}-digit code to{" "}
        <strong className="otp-email">{email}</strong>. Please check your inbox.
      </p>

      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}

        <label id="otp-label">Verification Code</label>
        <div
          className="otp-grid"
          role="group"
          aria-labelledby="otp-label"
          onPaste={handlePaste}
        >
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => (inputsRef.current[i] = el)}
              className="otp-box"
              type="text"
              inputMode="numeric"
              autoComplete={i === 0 ? "one-time-code" : "off"}
              maxLength={1}
              value={d}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onFocus={(e) => e.target.select()}
              aria-label={`Digit ${i + 1}`}
              autoFocus={i === 0}
            />
          ))}
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? (
            "Verifying..."
          ) : (
            <>
              Verify <span aria-hidden="true">→</span>
            </>
          )}
        </button>

        <p className="auth-switch">
          Wrong account? <Link to="/login">Back to Login</Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default VerifyOTP;

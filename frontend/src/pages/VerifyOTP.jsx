import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { verifyOTP } from "../api/authApi";
import { useAuth } from "../context/AuthContext";

const VerifyOTP = () => {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  // Kinukuha natin yung email na ipinasa galing sa Login page
  const email = location.state?.email;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await verifyOTP(email, otp);
      // Successful na! Ito na yung tunay na "login" — i-save natin sa Context + localStorage
      login(response.data.user, response.data.token);

      // Depende sa role, iba ang pupuntahang dashboard
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
    } finally {
      setLoading(false);
    }
  };

  // Kung walang email (hal. direktang pumunta dito nang hindi dumaan sa login), ibalik sa login
  if (!email) {
    return (
      <div className="auth-container">
        <p>No email provided. Please login first.</p>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="auth-logo">🦷</div>
        <h2>Verify Your Identity</h2>
        <p>We sent a 6-digit code to {email}. Please check your inbox.</p>

        {error && <p className="error-message">{error}</p>}

        <label>Verification Code</label>
        <input
          type="text"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          maxLength={6}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Verifying..." : "Verify"}
        </button>
      </form>
    </div>
  );
};

export default VerifyOTP;

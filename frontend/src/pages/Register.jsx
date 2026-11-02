import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "../api/authApi";
import AuthLayout from "../components/AuthLayout";

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

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// Letters (including ñ, é, etc.) and spaces only. No numbers, apostrophes, hyphens or periods.
const NAME_REGEX = /^\p{L}[\p{L}\s]*$/u;
// At least 2 words, each at least 2 letters (e.g. "Juan Dela Cruz")
const FULL_NAME_REGEX = /^\p{L}{2,}(\s+\p{L}{2,})+$/u;
// Same letter 3+ times in a row (e.g. "tttt")
const REPEATED_CHARS_REGEX = /(\p{L})\1{2,}/iu;
// Philippine mobile number: 11 digits, starts with 09
const PHONE_REGEX = /^09\d{9}$/;

const validate = ({ name, email, password, phone }) => {
  const errors = {};

  if (!name.trim()) errors.name = "Full name is required.";
  else if (!NAME_REGEX.test(name.trim()))
    errors.name = "Name can only contain letters and spaces.";
  else if (!FULL_NAME_REGEX.test(name.trim()))
    errors.name = "Please enter your first and last name.";
  else if (REPEATED_CHARS_REGEX.test(name.trim()))
    errors.name = "Please enter a valid name.";

  if (!email.trim()) errors.email = "Email is required.";
  else if (!EMAIL_REGEX.test(email.trim()))
    errors.email = "Enter a valid email, like name@example.com.";

  if (!password) errors.password = "Password is required.";
  else if (password.length < 8)
    errors.password = "Password must be at least 8 characters.";
  else if (!/[A-Za-z]/.test(password) || !/\d/.test(password))
    errors.password = "Password must include both letters and numbers.";

  // Phone is required: 11 digits starting with 09.
  if (!phone) errors.phone = "Phone number is required.";
  else if (!PHONE_REGEX.test(phone))
    errors.phone =
      "Phone number must be 11 digits and start with 09 (e.g. 09171234567).";

  return errors;
};

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const errors = validate(formData);
  const showError = (field) => (touched[field] ? errors[field] : "");

  const handleChange = (e) => {
    let { name, value } = e.target;
    if (name === "phone") value = value.replace(/\D/g, ""); // digits only
    setFormData({ ...formData, [name]: value });
  };

  const handleBlur = (e) => {
    setTouched({ ...touched, [e.target.name]: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Show every error at once if the form is not valid
    if (Object.keys(errors).length > 0) {
      setTouched({ name: true, email: true, password: true, phone: true });
      return;
    }

    setLoading(true);

    try {
      await registerUser({
        ...formData,
        email: formData.email.trim(),
        name: formData.name.trim(),
      });
      // Registered as a patient — go to login (2FA still applies on login)
      navigate("/login");
    } catch (err) {
      const validationErrors = err.response?.data?.errors;
      if (validationErrors && validationErrors.length > 0) {
        setError(validationErrors.map((e) => e.message).join(", "));
      } else {
        setError(
          err.response?.data?.message ||
            "Registration failed. Please try again.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const field = (name, label, type, placeholder, extra = {}) => (
    <>
      <label htmlFor={name}>{label}</label>
      <div className="input-wrap">
        <input
          id={name}
          name={name}
          type={name === "password" && showPassword ? "text" : type}
          placeholder={placeholder}
          value={formData[name]}
          onChange={handleChange}
          onBlur={handleBlur}
          className={`no-icon ${showError(name) ? "invalid" : ""}`}
          aria-invalid={!!showError(name)}
          aria-describedby={showError(name) ? `${name}-error` : undefined}
          {...extra}
        />
        {name === "password" && (
          <button
            type="button"
            className="input-toggle"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            <EyeIcon off={showPassword} />
          </button>
        )}
      </div>
      {showError(name) && (
        <p className="field-error" id={`${name}-error`} role="alert">
          {showError(name)}
        </p>
      )}
    </>
  );

  return (
    <AuthLayout>
      <h2 className="auth-title">Create an Account</h2>
      <p className="auth-subtitle">
        Register as a Germino-Punzal Dental patient
      </p>

      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}

        {field("name", "Full Name", "text", "e.g. Esmi Ringhoy")}
        {field("email", "Email", "email", "Enter your email")}
        {field(
          "password",
          "Password",
          "password",
          "At least 8 characters, letters and numbers",
        )}
        {field("phone", "Phone Number", "tel", "09XXXXXXXXX", {
          inputMode: "numeric",
          maxLength: 11,
        })}

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? (
            "Creating account..."
          ) : (
            <>
              Register <span aria-hidden="true">→</span>
            </>
          )}
        </button>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default Register;

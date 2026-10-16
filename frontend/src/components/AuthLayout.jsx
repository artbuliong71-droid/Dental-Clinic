// src/components/AuthLayout.jsx
import "./auth.css";
// Change this path if your logo lives somewhere else.
import logo from "../assets/logo.jpg";

const Tooth = () => (
  <svg className="brand-tooth" viewBox="0 0 220 240" aria-hidden="true">
    <defs>
      <radialGradient id="toothFill" cx="40%" cy="25%" r="80%">
        <stop offset="0" stopColor="#ffffff" />
        <stop offset="0.6" stopColor="#f1e8fb" />
        <stop offset="1" stopColor="#d3bdf0" />
      </radialGradient>
      <linearGradient id="ring" x1="0" x2="1">
        <stop offset="0" stopColor="#8e3bb8" />
        <stop offset="1" stopColor="#c9a2ec" />
      </linearGradient>
    </defs>
    <ellipse cx="110" cy="228" rx="60" ry="8" fill="#9a6fc8" opacity=".35" />
    <g transform="rotate(-20 110 130)">
      <path
        d="M15 130A95 28 0 0 1 205 130"
        stroke="url(#ring)"
        strokeWidth="9"
        fill="none"
        opacity=".55"
      />
    </g>
    <path
      d="M110 30C85 8 38 18 38 72c0 40 20 58 24 98 3 30 18 42 26 20 6-18 10-38 22-38s16 20 22 38c8 22 23 10 26-20 4-40 24-58 24-98 0-54-47-64-72-42z"
      fill="url(#toothFill)"
    />
    <g transform="rotate(-20 110 130)">
      <path
        d="M15 130A95 28 0 0 0 205 130"
        stroke="url(#ring)"
        strokeWidth="9"
        fill="none"
        strokeLinecap="round"
      />
    </g>
  </svg>
);

const Plus = ({ className }) => (
  <span className={`deco-plus ${className}`} aria-hidden="true" />
);
const Hex = ({ className }) => (
  <span className={`deco-hex ${className}`} aria-hidden="true" />
);

const AuthLayout = ({ children }) => (
  <div className="auth-page">
    <section className="auth-side">
      <div className="auth-card">
        <img
          src={logo}
          alt="Germino-Punzal Dental Clinic logo"
          className="auth-logo"
        />
        {children}
      </div>
    </section>

    <aside className="auth-brand">
      <Plus className="plus-a" />
      <Plus className="plus-b" />
      <Hex className="hex-a" />
      <Hex className="hex-b" />
      <Hex className="hex-c" />
      <div className="brand-wave" />
      <div className="brand-content">
        <img src={logo} alt="" className="brand-logo" />
        <h1>GERMINO-PUNZAL</h1>
        <h2>DENTAL CLINIC</h2>
        <p>
          Healthy Smiles <span>•</span> Brighter Futures
        </p>
        <Tooth />
      </div>
    </aside>
  </div>
);

export default AuthLayout;

import "./auth.css";

const ToothLogo = () => (
  <svg
    viewBox="0 0 64 64"
    width="56"
    height="56"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M10 20c0-8 8-11 15-8 4 2 6 2 10 0 5-2 11-1 12 6 1 7-3 11-4 18-1 7-3 14-6 14-4 0-3-11-8-11s-4 11-8 11c-3 0-5-7-6-14-1-7-5-9-5-16z"
      stroke="#3f7fc8"
      strokeWidth="4"
      strokeLinejoin="round"
    />
    <path
      d="M50 4l2.5 6.5L59 13l-6.5 2.5L50 22l-2.5-6.5L41 13l6.5-2.5z"
      fill="#3f7fc8"
    />
  </svg>
);

const Tooth = () => (
  <svg className="brand-tooth" viewBox="0 0 220 240" aria-hidden="true">
    <defs>
      <radialGradient id="toothFill" cx="40%" cy="25%" r="80%">
        <stop offset="0" stopColor="#ffffff" />
        <stop offset="0.6" stopColor="#e6f0fc" />
        <stop offset="1" stopColor="#bcd4f0" />
      </radialGradient>
      <linearGradient id="ring" x1="0" x2="1">
        <stop offset="0" stopColor="#6fb2ea" />
        <stop offset="1" stopColor="#bfe0fa" />
      </linearGradient>
    </defs>
    <ellipse cx="110" cy="228" rx="60" ry="8" fill="#9bbfe6" opacity=".35" />
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
        <div className="auth-logo">
          <ToothLogo />
        </div>
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
        <h1>GERMINO</h1>
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

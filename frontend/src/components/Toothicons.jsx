// Custom dental icons (lucide-react has no tooth or braces icon).
// They take the same props as lucide icons: size, strokeWidth, className.
const base = (size, strokeWidth) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
});

const TOOTH =
  "M12 5.6C10.6 4.1 8.6 3.2 6.9 3.7 4.7 4.4 3.9 6.8 4.5 9.2c.5 2 1.3 3.2 1.6 5.3.3 2.2.5 5 1.4 6 .8.9 1.8.2 2.2-1.4.4-1.7.6-3.2 2.3-3.2s1.9 1.5 2.3 3.2c.4 1.6 1.4 2.3 2.2 1.4.9-1 1.1-3.8 1.4-6 .3-2.1 1.1-3.3 1.6-5.3.6-2.4-.2-4.8-2.4-5.5-1.7-.5-3.7.4-5.1 1.9z";

export const ToothIcon = ({ size = 24, strokeWidth = 1.8 }) => (
  <svg {...base(size, strokeWidth)}>
    <path d={TOOTH} />
  </svg>
);

// Tooth with a small mark on it (used for extraction)
export const ToothPinIcon = ({ size = 24, strokeWidth = 1.8 }) => (
  <svg {...base(size, strokeWidth)}>
    <path d={TOOTH} />
    <circle cx="12" cy="9.6" r="2" />
    <path d="M12 8.9v1.4M11.3 9.6h1.4" strokeWidth={strokeWidth * 0.7} />
  </svg>
);

// Three teeth with brackets and a wire (used for orthodontics)
export const BracesIcon = ({ size = 24, strokeWidth = 1.8 }) => (
  <svg {...base(size, strokeWidth)}>
    <rect x="1.8" y="6.5" width="6.2" height="11" rx="2.2" />
    <rect x="8.9" y="6.5" width="6.2" height="11" rx="2.2" />
    <rect x="16" y="6.5" width="6.2" height="11" rx="2.2" />
    <path d="M1 12h22" />
    <rect x="3.8" y="10.4" width="2.2" height="3.2" rx="0.6" />
    <rect x="10.9" y="10.4" width="2.2" height="3.2" rx="0.6" />
    <rect x="18" y="10.4" width="2.2" height="3.2" rx="0.6" />
  </svg>
);

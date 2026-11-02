import "./analyticsView.css";
import { useState } from "react";
import {
  CalendarDays,
  Check,
  Clock,
  Users,
  RefreshCw,
  Download,
  FileText,
} from "lucide-react";
import { exportCSV, printReport } from "../utils/exportAnalytics";
import "./analytics.css";

const monthLabel = (ym) => {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-PH", { month: "short" });
};

const COLORS = {
  blue: "#3b82f6",
  green: "#16a34a",
  amber: "#f59e0b",
  red: "#ef4444",
  purple: "#7c5cdb",
};

/* ---------- helpers ---------- */
// Magandang taas ng axis (5, 10, 25, 50 ...)
const niceScale = (max) => {
  if (max <= 5) return { top: 5, step: 1 };
  const rough = max / 5;
  const pow = 10 ** Math.floor(Math.log10(rough));
  const f = rough / pow;
  const nice = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10;
  const step = nice * pow;
  return { top: Math.ceil(max / step) * step, step };
};
const makeTicks = (top, step) => {
  const t = [];
  for (let v = 0; v <= top; v += step) t.push(v);
  return t;
};

/* ---------- SVG charts (walang chart library) ---------- */
const W = 640;
const H = 300;
const L = 52;
const R = 14;
const T = 28;
const B = 48;
const PW = W - L - R;
const PH = H - T - B;

const Axes = ({ ticks, top, xTitle, yTitle }) => {
  const y = (v) => T + PH - (v / top) * PH;
  return (
    <>
      {ticks.map((v) => (
        <g key={v}>
          <line
            x1={L}
            x2={W - R}
            y1={y(v)}
            y2={y(v)}
            className="ax-grid-line"
          />
          <text x={L - 8} y={y(v) + 4} textAnchor="end" className="ax-tick">
            {v}
          </text>
        </g>
      ))}
      <text
        transform={`translate(14 ${T + PH / 2}) rotate(-90)`}
        textAnchor="middle"
        className="ax-axis-title"
      >
        {yTitle}
      </text>
      <text
        x={L + PW / 2}
        y={H - 6}
        textAnchor="middle"
        className="ax-axis-title"
      >
        {xTitle}
      </text>
    </>
  );
};

const BarChart = ({
  items,
  color,
  xTitle,
  yTitle = "Number of Bookings",
  label,
}) => {
  const max = Math.max(...items.map((i) => i.value), 0);
  const { top, step } = niceScale(max);
  const ticks = makeTicks(top, step);
  const y = (v) => T + PH - (v / top) * PH;
  const slot = PW / Math.max(items.length, 1);
  const bw = Math.min(slot * 0.6, 52);

  return (
    <svg
      className="ax-chart"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={label}
    >
      <Axes ticks={ticks} top={top} xTitle={xTitle} yTitle={yTitle} />
      {items.map((it, i) => {
        const x = L + slot * i + (slot - bw) / 2;
        const h = (it.value / top) * PH;
        return (
          <g key={it.label}>
            <rect
              x={x}
              y={y(it.value)}
              width={bw}
              height={h}
              rx="5"
              fill={color}
            >
              <title>{`${it.label}: ${it.value}`}</title>
            </rect>
            <text
              x={x + bw / 2}
              y={y(it.value) - 7}
              textAnchor="middle"
              className="ax-bval"
            >
              {it.value}
            </text>
            <text
              x={x + bw / 2}
              y={H - B + 18}
              textAnchor="middle"
              className="ax-tick"
            >
              {it.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

const LineChart = ({ items, color, gid, xTitle, yTitle, label }) => {
  const max = Math.max(...items.map((i) => i.value), 0);
  const { top, step } = niceScale(max);
  const ticks = makeTicks(top, step);
  const n = items.length;
  const y = (v) => T + PH - (v / top) * PH;
  const x = (i) => (n === 1 ? L + PW / 2 : L + 28 + ((PW - 56) * i) / (n - 1));
  const pts = items.map((it, i) => [x(i), y(it.value)]);
  const line = pts.length ? "M" + pts.map((p) => p.join(",")).join(" L") : "";
  const area = pts.length
    ? `${line} L${x(n - 1)},${y(0)} L${x(0)},${y(0)} Z`
    : "";

  return (
    <svg
      className="ax-chart"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={label}
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <Axes ticks={ticks} top={top} xTitle={xTitle} yTitle={yTitle} />
      {area && <path d={area} fill={`url(#${gid})`} />}
      {line && (
        <path
          d={line}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
      )}
      {items.map((it, i) => (
        <g key={it.label}>
          <circle
            cx={x(i)}
            cy={y(it.value)}
            r="4.5"
            fill={color}
            stroke="#fff"
            strokeWidth="2"
          >
            <title>{`${it.label}: ${it.value}`}</title>
          </circle>
          <text
            x={x(i)}
            y={y(it.value) - 11}
            textAnchor="middle"
            className="ax-bval"
            fill={color}
          >
            {it.value}
          </text>
          <text x={x(i)} y={H - B + 18} textAnchor="middle" className="ax-tick">
            {it.label}
          </text>
        </g>
      ))}
    </svg>
  );
};

/* ---------- horizontal bars (services) ---------- */
const HBars = ({ items, color }) => {
  const max = Math.max(...items.map((i) => i.value), 0);
  const { top, step } = niceScale(max);
  const ticks = makeTicks(top, step);
  const pct = (v) => `${(v / top) * 100}%`;

  return (
    <div className="ax-hb">
      <div className="ax-hb-body">
        <div className="ax-hb-grid">
          {ticks.map((v) => (
            <i key={v} style={{ left: pct(v) }} />
          ))}
        </div>
        {items.map((it) => (
          <div className="ax-hb-row" key={it.label}>
            <span className="ax-hb-name" title={it.label}>
              {it.label}
            </span>
            <div className="ax-hb-plot">
              <div className="ax-hb-track">
                <div
                  className="ax-hb-bar"
                  style={{ width: pct(it.value), background: color }}
                />
                <b style={{ left: `calc(${pct(it.value)} + 8px)` }}>
                  {it.value}
                </b>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="ax-hb-axis">
        {ticks.map((v) => (
          <span key={v} style={{ left: pct(v) }}>
            {v}
          </span>
        ))}
      </div>
      <p className="ax-axis-title-h">Number of Bookings</p>
    </div>
  );
};

/* ---------- Card ---------- */
const Card = ({ title, sub, wide, action, children }) => (
  <section className={`ax-card ${wide ? "ax-wide" : ""}`}>
    <div className="ax-card-head">
      <div>
        <h3>{title}</h3>
        {sub && <p className="ax-sub">{sub}</p>}
      </div>
      {action}
    </div>
    {children}
  </section>
);

const Select = ({ value, onChange, options, label }) => (
  <select
    className="ax-select"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    aria-label={label}
  >
    {options.map((o) => (
      <option key={o.key} value={o.key}>
        {o.label}
      </option>
    ))}
  </select>
);

/* ---------- Busiest (Hours / Days / Monthly / Yearly) ---------- */
const TIME_OPTIONS = [
  { key: "hours", label: "Hours" },
  { key: "days", label: "Days" },
  { key: "monthly", label: "Monthly" },
  { key: "yearly", label: "Yearly" },
];

const TimeCard = ({ busiestHours, busiestDays, monthly, yearly }) => {
  const [view, setView] = useState("hours");

  const views = {
    hours: {
      title: "Busiest Hours",
      sub: "Which time slots do patients book the most?",
      xTitle: "Time",
      items: (busiestHours || []).map((h) => ({
        label: h.label.replace(" ", " "),
        value: h.count,
      })),
    },
    days: {
      title: "Busiest Days",
      sub: "Which days of the week are the busiest?",
      xTitle: "Day",
      items: (busiestDays || []).map((d) => ({ label: d.day, value: d.count })),
    },
    monthly: {
      title: "Appointments per Month",
      sub: "Last 6 months, all statuses",
      xTitle: "Month",
      items: (monthly || []).map((m) => ({
        label: monthLabel(m.month),
        value: m.total,
      })),
    },
    yearly: {
      title: "Appointments per Year",
      sub: "All statuses",
      xTitle: "Year",
      items: (yearly || []).map((y) => ({
        label: String(y.year),
        value: y.total,
      })),
    },
  };
  const cur = views[view];

  return (
    <Card
      title={cur.title}
      sub={cur.sub}
      action={
        <Select
          value={view}
          onChange={setView}
          options={TIME_OPTIONS}
          label="Choose view"
        />
      }
    >
      {cur.items.length === 0 ? (
        <p className="ax-empty">No data yet.</p>
      ) : (
        <BarChart
          items={cur.items}
          color={COLORS.blue}
          xTitle={cur.xTitle}
          label={cur.title}
        />
      )}
    </Card>
  );
};

/* ---------- Patients booking (per day / per month) ---------- */
const PATIENT_OPTIONS = [
  { key: "day", label: "Per day of week" },
  { key: "month", label: "Per month" },
];

const PatientsCard = ({ patientsByDay, patientsByMonth }) => {
  const [view, setView] = useState("day");

  const items =
    view === "day"
      ? (patientsByDay || []).map((d) => ({ label: d.day, value: d.patients }))
      : (patientsByMonth || []).map((m) => ({
          label: monthLabel(m.month),
          value: m.patients,
        }));

  return (
    <Card
      title="Number of Patients Booking"
      sub="Different patients who booked (cancelled not counted)."
      action={
        <Select
          value={view}
          onChange={setView}
          options={PATIENT_OPTIONS}
          label="Choose view"
        />
      }
    >
      {items.length === 0 ? (
        <p className="ax-empty">No data yet.</p>
      ) : (
        <LineChart
          items={items}
          color={COLORS.green}
          gid="ax-grad-patients"
          xTitle={view === "day" ? "Day" : "Month"}
          yTitle="Number of Patients"
          label="Patients booking"
        />
      )}
    </Card>
  );
};

/* ---------- Status donut ---------- */
const STATUS_COLORS = {
  Completed: COLORS.green,
  Confirmed: COLORS.blue,
  Pending: COLORS.amber,
  Cancelled: COLORS.red,
};

const StatusDonut = ({ byStatus, total }) => {
  const entries = Object.keys(STATUS_COLORS)
    .filter((s) => s !== "Cancelled")
    .map((s) => ({
      status: s,
      count: byStatus?.[s] ?? 0,
      color: STATUS_COLORS[s],
    }));
  const sum = entries.reduce((a, e) => a + e.count, 0);
  const pctOf = (n) => (sum ? (n / sum) * 100 : 0);

  let offset = 0;
  const arcs = entries
    .filter((e) => e.count > 0)
    .map((e) => {
      const len = pctOf(e.count);
      const start = offset;
      offset += len;
      const mid = ((start + len / 2) / 100) * 2 * Math.PI - Math.PI / 2;
      return {
        ...e,
        len,
        start,
        lx: 18 + 14 * Math.cos(mid),
        ly: 18 + 14 * Math.sin(mid),
      };
    });

  return (
    <div className="ax-donut-wrap">
      <div className="ax-donut">
        <svg viewBox="0 0 36 36" role="img" aria-label="Appointments by status">
          <circle
            cx="18"
            cy="18"
            r="14"
            fill="none"
            stroke="#f1f5f9"
            strokeWidth="7"
          />
          {arcs.map((a) => (
            <circle
              key={a.status}
              cx="18"
              cy="18"
              r="14"
              fill="none"
              stroke={a.color}
              strokeWidth="7"
              pathLength="100"
              strokeDasharray={`${a.len} ${100 - a.len}`}
              strokeDashoffset={-a.start}
              transform="rotate(-90 18 18)"
            />
          ))}
          {arcs
            .filter((a) => a.len >= 8)
            .map((a) => (
              <text
                key={`t-${a.status}`}
                x={a.lx}
                y={a.ly + 1}
                textAnchor="middle"
                className="ax-donut-pct"
              >
                {Math.round(a.len)}%
              </text>
            ))}
        </svg>
        <div className="ax-donut-center">
          <strong>{total}</strong>
          <span>Appointments</span>
        </div>
      </div>

      <table className="ax-legend">
        <tbody>
          {entries.map((e) => (
            <tr key={e.status}>
              <td>
                <i style={{ background: e.color }} />
                {e.status}
              </td>
              <td className="num">{e.count}</td>
              <td className="num muted">{pctOf(e.count).toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/* ---------- Main ---------- */
const AnalyticsView = ({ analytics, onRefresh, refreshing }) => {
  const refreshButton = (
    <button
      type="button"
      className="ax-btn"
      onClick={onRefresh}
      disabled={refreshing}
    >
      <RefreshCw
        size={16}
        className={refreshing ? "ax-spin" : ""}
        aria-hidden="true"
      />
      {refreshing ? "Running PySpark..." : "Refresh"}
    </button>
  );

  if (!analytics) {
    return (
      <div>
        <div className="ax-head">
          <h2>Analytics</h2>
          {refreshButton}
        </div>
        <div className="ax-card">
          <p className="ax-empty">
            No analytics yet. Click Refresh to run the PySpark job and build
            your first report.
          </p>
        </div>
      </div>
    );
  }

  const {
    summary,
    monthly,
    yearly,
    topServices,
    busiestHours,
    busiestDays,
    newPatients,
    patients,
    patientsByDay,
    patientsByMonth,
  } = analytics;

  const updated = analytics.generatedAt
    ? new Date(analytics.generatedAt).toLocaleString("en-PH", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "";

  const stats = [
    {
      label: "Total Appointments",
      value: summary.totalAppointments,
      icon: CalendarDays,
      color: COLORS.blue,
    },
    {
      label: "Patients Booking",
      value: patients.totalPatients,
      icon: Users,
      color: COLORS.green,
    },
    {
      label: "Completion Rate",
      value: `${summary.completionRate}%`,
      icon: Check,
      color: COLORS.amber,
    },
    {
      label: "Upcoming",
      value:
        (summary.byStatus?.Pending ?? 0) + (summary.byStatus?.Confirmed ?? 0),
      icon: Clock,
      color: COLORS.purple,
    },
  ];

  return (
    <div>
      <div className="ax-head">
        <div>
          <h2>Analytics</h2>
          {updated && (
            <span className="ax-updated">
              <span className="ax-dot" /> Live · Computed with PySpark · Updated{" "}
              {updated}
            </span>
          )}
        </div>
        <div className="ax-actions">
          <button
            type="button"
            className="ax-btn"
            onClick={() => exportCSV(analytics)}
          >
            <Download size={16} aria-hidden="true" /> CSV
          </button>
          <button
            type="button"
            className="ax-btn"
            onClick={() => printReport(analytics)}
          >
            <FileText size={16} aria-hidden="true" /> PDF
          </button>
          {refreshButton}
        </div>
      </div>

      <div className="ax-stats">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div className="ax-stat" key={label} style={{ "--c": color }}>
            <span className="ax-stat-icon">
              <Icon size={26} />
            </span>
            <div>
              <span className="ax-stat-number">{value}</span>
              <span className="ax-stat-label">{label}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="ax-grid">
        <TimeCard
          busiestHours={busiestHours}
          busiestDays={busiestDays}
          monthly={monthly}
          yearly={yearly}
        />

        <PatientsCard
          patientsByDay={patientsByDay}
          patientsByMonth={patientsByMonth}
        />

        <Card
          title="Appointment Status Overview"
          sub="Breakdown of appointment statuses."
        >
          <StatusDonut
            byStatus={summary.byStatus}
            total={summary.totalAppointments}
          />
        </Card>

        <Card
          title="Most Requested Dental Services"
          sub="Which dental services do patients book the most? (cancelled not counted)"
        >
          {topServices.length === 0 ? (
            <p className="ax-empty">No bookings yet.</p>
          ) : (
            <HBars
              color={COLORS.purple}
              items={topServices
                .slice(0, 6)
                .map((s) => ({ label: s.name, value: s.bookings }))}
            />
          )}
        </Card>

        <Card title="New Patients per Month" sub="Last 6 months">
          <BarChart
            items={(newPatients || []).map((n) => ({
              label: monthLabel(n.month),
              value: n.count,
            }))}
            color={COLORS.green}
            xTitle="Month"
            yTitle="New Patients"
            label="New patients per month"
          />
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsView;

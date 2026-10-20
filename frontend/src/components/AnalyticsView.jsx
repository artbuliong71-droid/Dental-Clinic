import { useState } from "react";
import { CalendarDays, Check, X, Users, RefreshCw } from "lucide-react";
import "./analytics.css";

const peso = (n) =>
  `₱${Number(n || 0).toLocaleString("en-PH", { maximumFractionDigits: 0 })}`;
const monthLabel = (ym) => {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-PH", { month: "short" });
};

const COLORS = {
  blue: "#2563eb",
  green: "#16a34a",
  red: "#dc2626",
  amber: "#f59e0b",
  teal: "#0d9488",
  cyan: "#0891b2",
  orange: "#ea580c",
};
const RANK_COLORS = [
  COLORS.blue,
  COLORS.teal,
  COLORS.amber,
  COLORS.orange,
  COLORS.cyan,
];

/** Vertical bar chart (no chart library needed). */
const BarChart = ({ items, color, label }) => {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <div role="img" aria-label={label} style={{ "--bar": color }}>
      <div className="ax-cols">
        {items.map((i) => {
          const pct = (i.value / max) * 100;
          return (
            <div
              className="ax-col"
              key={i.label}
              title={`${i.label}: ${i.value}`}
            >
              <span
                className="ax-val"
                style={{ bottom: `calc(${pct}% + 6px)` }}
              >
                {i.value}
              </span>
              <div className="ax-bar" style={{ height: `${pct}%` }} />
            </div>
          );
        })}
      </div>
      <div className="ax-labels">
        {items.map((i) => (
          <span className="ax-label" key={i.label}>
            {i.label}
          </span>
        ))}
      </div>
    </div>
  );
};

const Card = ({ title, sub, wide, children }) => (
  <section className={`ax-card ${wide ? "ax-wide" : ""}`}>
    <h3>{title}</h3>
    {sub && <p className="ax-sub">{sub}</p>}
    {children}
  </section>
);

/* ---------- Tabs: Hours / Days / Monthly / Yearly ---------- */
const TABS = [
  { key: "hours", label: "Hours", color: COLORS.amber },
  { key: "days", label: "Days", color: COLORS.teal },
  { key: "monthly", label: "Monthly", color: COLORS.blue },
  { key: "yearly", label: "Yearly", color: COLORS.cyan },
];

const TimeCard = ({ busiestHours, busiestDays, monthly, yearly }) => {
  const [tab, setTab] = useState("hours");

  const views = {
    hours: {
      title: "Busiest hours",
      sub: "Which times patients book the most",
      items: (busiestHours || []).map((h) => ({
        label: h.label.replace(" ", ""),
        value: h.count,
      })),
    },
    days: {
      title: "Busiest days",
      sub: "Bookings by day of the week",
      items: (busiestDays || []).map((d) => ({ label: d.day, value: d.count })),
    },
    monthly: {
      title: "Appointments per month",
      sub: "Last 6 months, all statuses",
      items: (monthly || []).map((m) => ({
        label: monthLabel(m.month),
        value: m.total,
      })),
    },
    yearly: {
      title: "Appointments per year",
      sub: "All statuses",
      items: (yearly || []).map((y) => ({
        label: String(y.year),
        value: y.total,
      })),
    },
  };
  const current = views[tab];
  const color = TABS.find((t) => t.key === tab).color;

  return (
    <section className="ax-card ax-wide" style={{ "--c": color }}>
      <div className="ax-tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            className={`ax-tab ${tab === t.key ? "active" : ""}`}
            style={{ "--c": t.color }}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <h3>{current.title}</h3>
      <p className="ax-sub">{current.sub}</p>
      {current.items.length === 0 ? (
        <p className="ax-empty">No data yet. Click Refresh to update.</p>
      ) : (
        <BarChart label={current.title} items={current.items} color={color} />
      )}
    </section>
  );
};

/* ---------- Donut: appointments by status ---------- */
const STATUS_COLORS = {
  Pending: COLORS.amber,
  Confirmed: COLORS.blue,
  Completed: COLORS.green,
  Cancelled: COLORS.red,
};

const StatusDonut = ({ byStatus, total }) => {
  const entries = Object.keys(STATUS_COLORS).map((s) => ({
    status: s,
    count: byStatus?.[s] ?? 0,
    color: STATUS_COLORS[s],
  }));
  const sum = entries.reduce((a, e) => a + e.count, 0);
  let offset = 0;

  return (
    <div className="ax-donut-wrap">
      <div className="ax-donut">
        <svg viewBox="0 0 36 36" role="img" aria-label="Appointments by status">
          <circle
            cx="18"
            cy="18"
            r="15.9155"
            fill="none"
            stroke="#f1f5f9"
            strokeWidth="4"
          />
          {sum > 0 &&
            entries.map((e) => {
              if (e.count === 0) return null;
              const len = (e.count / sum) * 100;
              const circle = (
                <circle
                  key={e.status}
                  cx="18"
                  cy="18"
                  r="15.9155"
                  fill="none"
                  stroke={e.color}
                  strokeWidth="4"
                  strokeDasharray={`${len} ${100 - len}`}
                  strokeDashoffset={-offset}
                  transform="rotate(-90 18 18)"
                />
              );
              offset += len;
              return circle;
            })}
        </svg>
        <div className="ax-donut-center">
          <strong>{total}</strong>
          <span>total</span>
        </div>
      </div>
      <ul className="ax-legend">
        {entries.map((e) => (
          <li key={e.status} style={{ "--c": e.color }}>
            <i />
            {e.status}
            <b>{e.count}</b>
          </li>
        ))}
      </ul>
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
  } = analytics;
  const maxBookings = Math.max(...topServices.map((s) => s.bookings), 1);
  const updated = analytics.generatedAt
    ? new Date(analytics.generatedAt).toLocaleString("en-PH", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "";

  const stats = [
    {
      label: "Total appointments",
      value: summary.totalAppointments,
      icon: CalendarDays,
      color: COLORS.blue,
    },
    {
      label: "Completion rate",
      value: `${summary.completionRate}%`,
      icon: Check,
      color: COLORS.green,
    },
    {
      label: "Cancellation rate",
      value: `${summary.cancellationRate}%`,
      icon: X,
      color: COLORS.red,
    },
    {
      label: "Patients",
      value: patients.totalPatients,
      icon: Users,
      color: COLORS.amber,
    },
  ];

  return (
    <div>
      <div className="ax-head">
        <div>
          <h2>Analytics</h2>
          {updated && (
            <span className="ax-updated">
              <span className="ax-dot" /> Computed with PySpark · Updated{" "}
              {updated}
            </span>
          )}
        </div>
        {refreshButton}
      </div>

      <div className="ax-stats">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div className="ax-stat" key={label} style={{ "--c": color }}>
            <span className="ax-stat-icon">
              <Icon size={22} />
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

        <Card
          title="Most booked services"
          sub="Cancelled bookings are not counted"
        >
          {topServices.length === 0 ? (
            <p className="ax-empty">No bookings yet.</p>
          ) : (
            <ul className="ax-rank-list">
              {topServices.map((s, i) => {
                const c = RANK_COLORS[i % RANK_COLORS.length];
                return (
                  <li key={s.name} style={{ "--c": c }}>
                    <div className="ax-rank-top">
                      <span className="ax-rank-badge">{i + 1}</span>
                      <span className="ax-rank-name">{s.name}</span>
                      <span className="ax-rank-meta">
                        {s.bookings} booking{s.bookings === 1 ? "" : "s"} ·{" "}
                        {peso(s.revenue)}
                      </span>
                    </div>
                    <div className="ax-track">
                      <div
                        className="ax-fill"
                        style={{
                          width: `${(s.bookings / maxBookings) * 100}%`,
                        }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card title="Appointments by status" sub="All appointments">
          <StatusDonut
            byStatus={summary.byStatus}
            total={summary.totalAppointments}
          />
        </Card>

        <Card title="New patients per month" sub="Last 6 months" wide>
          <BarChart
            label="New patients per month"
            color={COLORS.green}
            items={newPatients.map((n) => ({
              label: monthLabel(n.month),
              value: n.count,
            }))}
          />
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsView;

import { CalendarDays, Check, X, Wallet, Users, RefreshCw } from "lucide-react";
import "./manage.css";

const peso = (n) =>
  `₱${Number(n || 0).toLocaleString("en-PH", { maximumFractionDigits: 0 })}`;
const pesoShort = (n) =>
  n >= 1000 ? `₱${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : `₱${n}`;
const monthLabel = (ym) => {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-PH", { month: "short" });
};

/** Simple vertical bar chart (no chart library needed). */
const BarChart = ({ items, format = (v) => v, label }) => {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <div className="bars" role="img" aria-label={label}>
      {items.map((i) => {
        const pct = (i.value / max) * 100;
        return (
          <div className="bar-col" key={i.label}>
            <div className="bar-track">
              <span
                className="bar-value"
                style={{ bottom: `calc(${pct}% + 4px)` }}
              >
                {format(i.value)}
              </span>
              <div className="bar" style={{ height: `${pct}%` }} />
            </div>
            <span className="bar-label">{i.label}</span>
          </div>
        );
      })}
    </div>
  );
};

const Card = ({ title, sub, children }) => (
  <section className="an-card">
    <h3>{title}</h3>
    {sub && <p className="an-sub">{sub}</p>}
    {children}
  </section>
);

const AnalyticsView = ({ analytics, onRefresh, refreshing }) => {
  const refreshButton = (
    <button
      type="button"
      className="btn-primary-sm"
      onClick={onRefresh}
      disabled={refreshing}
    >
      <RefreshCw
        size={16}
        className={refreshing ? "spin" : ""}
        aria-hidden="true"
      />{" "}
      {refreshing ? "Running PySpark..." : "Refresh"}
    </button>
  );

  if (!analytics) {
    return (
      <div>
        <h2>Analytics</h2>
        <div className="empty-state">
          <p>
            No analytics yet. Click Refresh to run the PySpark job and build
            your first report.
          </p>
          {refreshButton}
        </div>
      </div>
    );
  }

  const {
    summary,
    monthly,
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
    },
    {
      label: "Completion rate",
      value: `${summary.completionRate}%`,
      icon: Check,
    },
    {
      label: "Cancellation rate",
      value: `${summary.cancellationRate}%`,
      icon: X,
    },
    {
      label: "Estimated revenue",
      value: peso(summary.estimatedRevenue),
      icon: Wallet,
    },
    { label: "Patients", value: patients.totalPatients, icon: Users },
  ];

  return (
    <div>
      <div className="an-head">
        <div>
          <h2>Analytics</h2>
          <p className="page-sub">
            Computed with PySpark{updated ? `. Last updated ${updated}` : ""}.
          </p>
        </div>
        {refreshButton}
      </div>

      <div className="stat-grid">
        {stats.map(({ label, value, icon: Icon }) => (
          <div className="stat-card" key={label}>
            <div className="stat-info">
              <span className="stat-number">{value}</span>
              <span className="stat-label">{label}</span>
            </div>
            <span className="stat-icon-wrap">
              <Icon size={22} />
            </span>
          </div>
        ))}
      </div>

      <div className="an-grid">
        <Card title="Appointments per month" sub="Last 6 months, all statuses">
          <BarChart
            label="Appointments per month"
            items={monthly.map((m) => ({
              label: monthLabel(m.month),
              value: m.total,
            }))}
          />
        </Card>

        <Card
          title="Estimated revenue per month"
          sub="Completed visits only, at the current service prices"
        >
          <BarChart
            label="Estimated revenue per month"
            format={pesoShort}
            items={monthly.map((m) => ({
              label: monthLabel(m.month),
              value: m.revenue,
            }))}
          />
        </Card>

        <Card
          title="Most booked services"
          sub="Cancelled bookings are not counted"
        >
          {topServices.length === 0 ? (
            <p className="muted">No bookings yet.</p>
          ) : (
            <ul className="hbar-list">
              {topServices.map((s) => (
                <li key={s.name}>
                  <div className="hbar-top">
                    <strong>{s.name}</strong>
                    <span>
                      {s.bookings} booking{s.bookings === 1 ? "" : "s"} ·{" "}
                      {peso(s.revenue)}
                    </span>
                  </div>
                  <div className="hbar-track">
                    <div
                      className="hbar"
                      style={{ width: `${(s.bookings / maxBookings) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Busiest hours" sub="Which times patients book the most">
          <BarChart
            label="Bookings by hour"
            items={busiestHours.map((h) => ({
              label: h.label.replace(" ", ""),
              value: h.count,
            }))}
          />
        </Card>

        <Card title="Busiest days" sub="Bookings by day of the week">
          <BarChart
            label="Bookings by day"
            items={busiestDays.map((d) => ({ label: d.day, value: d.count }))}
          />
        </Card>

        <Card title="New patients per month" sub="Last 6 months">
          <BarChart
            label="New patients per month"
            items={newPatients.map((n) => ({
              label: monthLabel(n.month),
              value: n.count,
            }))}
          />
        </Card>

        <Card
          title="Returning patients"
          sub="Patients with 2 or more completed visits"
        >
          <ul className="hbar-list">
            <li>
              <div className="hbar-top">
                <strong>Returning</strong>
                <span>
                  {patients.returningPatients} ({patients.returningRate}%)
                </span>
              </div>
              <div className="hbar-track">
                <div
                  className="hbar"
                  style={{ width: `${patients.returningRate}%` }}
                />
              </div>
            </li>
            <li>
              <div className="hbar-top">
                <strong>One-time</strong>
                <span>{patients.oneTimePatients}</span>
              </div>
              <div className="hbar-track">
                <div
                  className="hbar"
                  style={{
                    width: `${patients.returningPatients + patients.oneTimePatients ? 100 - patients.returningRate : 0}%`,
                  }}
                />
              </div>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsView;

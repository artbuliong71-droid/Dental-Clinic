import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Search } from "lucide-react";
import { getAuditLogs } from "../api/adminApi";
import "./manage.css";

const EVENTS = {
  login: { label: "Logged in", badge: "status-completed" },
  login_failed: { label: "Failed login", badge: "status-cancelled" },
  otp_failed: { label: "Wrong verification code", badge: "status-cancelled" },
  register: { label: "Registered", badge: "status-confirmed" },
  staff_created: { label: "Created staff account", badge: "status-confirmed" },
  account_deleted: { label: "Deleted account", badge: "status-pending" },
  password_reset: { label: "Reset password", badge: "status-pending" },
};

const emptyFilters = { q: "", action: "", role: "" };
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");

const dateOf = (v) =>
  new Date(v).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
const timeOf = (v) =>
  new Date(v).toLocaleTimeString("en-PH", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });

// What the entry was about: the account that was created/deleted, or the failure reason
const detailsOf = (log) => {
  if (log.target && (log.target.name || log.target.email)) {
    const who = [
      log.target.name,
      log.target.email ? `(${log.target.email})` : "",
    ]
      .filter(Boolean)
      .join(" ");
    return `${log.target.role ? `${cap(log.target.role)}: ` : ""}${who}`;
  }
  return log.detail || "";
};

/** Read-only history of logins and account changes. */
const AuditLogsView = () => {
  const [filters, setFilters] = useState(emptyFilters); // what is typed in the form
  const [applied, setApplied] = useState(emptyFilters); // what is used for the search
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ logs: [], pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = { page, limit: 20 };
      Object.entries(applied).forEach(([key, value]) => {
        if (value) params[key] = value;
      });
      const res = await getAuditLogs(params);
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load the audit logs.");
    } finally {
      setLoading(false);
    }
  }, [page, applied]);

  useEffect(() => {
    load();
  }, [load]);

  const change = (e) =>
    setFilters({ ...filters, [e.target.name]: e.target.value });

  const search = (e) => {
    e.preventDefault();
    setPage(1);
    setApplied(filters);
  };

  const clear = () => {
    setFilters(emptyFilters);
    setApplied(emptyFilters);
    setPage(1);
  };

  return (
    <div>
      <form className="audit-filters" onSubmit={search}>
        <div className="field">
          <label htmlFor="au-q">Search name or email</label>
          <input
            id="au-q"
            name="q"
            type="search"
            value={filters.q}
            onChange={change}
            placeholder="e.g. Art"
          />
        </div>
        <div className="field">
          <label htmlFor="au-action">Event</label>
          <select
            id="au-action"
            name="action"
            value={filters.action}
            onChange={change}
          >
            <option value="">All events</option>
            {Object.entries(EVENTS).map(([key, { label }]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="au-role">Role</label>
          <select
            id="au-role"
            name="role"
            value={filters.role}
            onChange={change}
          >
            <option value="">All roles</option>
            <option value="patient">Patient</option>
            <option value="staff">Staff</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div className="audit-actions">
          <button type="submit" className="btn-primary-sm">
            <Search size={15} aria-hidden="true" /> Search
          </button>
          <button type="button" className="btn-ghost" onClick={clear}>
            Clear
          </button>
          <button
            type="button"
            className="btn-ghost"
            onClick={load}
            aria-label="Refresh the list"
          >
            <RefreshCw
              size={15}
              className={loading ? "spin" : ""}
              aria-hidden="true"
            />
          </button>
        </div>
      </form>

      {error && (
        <p className="error-message banner" role="alert">
          {error}
        </p>
      )}

      {!error && !loading && data.logs.length === 0 ? (
        <div className="empty-state">
          <p>No activity found.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date and time</th>
                <th>Event</th>
                <th>User</th>
                <th>Role</th>
                <th>Details</th>
                <th>IP address</th>
              </tr>
            </thead>
            <tbody>
              {data.logs.map((log) => {
                const event = EVENTS[log.action] || {
                  label: log.action,
                  badge: "status-pending",
                };
                return (
                  <tr key={log._id}>
                    <td data-label="Date and time">
                      <strong>{dateOf(log.createdAt)}</strong>
                      <span className="cell-sub">{timeOf(log.createdAt)}</span>
                    </td>
                    <td data-label="Event">
                      <span className={`status-badge ${event.badge}`}>
                        {event.label}
                      </span>
                    </td>
                    <td data-label="User">
                      <strong>{log.actor?.name || "Unknown"}</strong>
                      <span className="cell-sub">{log.actor?.email || ""}</span>
                    </td>
                    <td data-label="Role">
                      {log.actor?.role ? (
                        <span className="pill">{cap(log.actor.role)}</span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td data-label="Details">{detailsOf(log) || "—"}</td>
                    <td data-label="IP address">{log.ip || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="pager">
        <span>
          {data.total} {data.total === 1 ? "entry" : "entries"} · Page{" "}
          {data.page || page} of {data.pages}
        </span>
        <div className="pager-buttons">
          <button
            type="button"
            className="btn-ghost"
            disabled={page <= 1 || loading}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </button>
          <button
            type="button"
            className="btn-ghost"
            disabled={page >= data.pages || loading}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuditLogsView;

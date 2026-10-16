import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import {
  apptWhen,
  formatDate,
  formatTime,
  isActiveStatus,
} from "../utils/dateUtils";
import "./manage.css";

const FILTERS = ["All", "Pending", "Confirmed", "Completed", "Cancelled"];

/**
 * Appointment table shared by the Admin and Staff dashboards.
 * onStatusUpdate(id, newStatus) should return a promise and handle its own errors.
 */
const AppointmentsManager = ({
  appointments,
  onStatusUpdate,
  showFilters = true,
  emptyText = "No appointments found.",
}) => {
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState(null);

  const counts = useMemo(() => {
    const c = { All: appointments.length };
    FILTERS.slice(1).forEach(
      (f) => (c[f] = appointments.filter((a) => a.status === f).length),
    );
    return c;
  }, [appointments]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (
      appointments
        .filter((a) => filter === "All" || a.status === filter)
        .filter((a) => {
          if (!q) return true;
          return [a.patient?.user?.name, a.service?.name, a.dentist?.user?.name]
            .filter(Boolean)
            .some((v) => v.toLowerCase().includes(q));
        })
        // Active ones first (soonest on top), then history (latest on top)
        .sort((a, b) => {
          const aa = isActiveStatus(a.status);
          const ba = isActiveStatus(b.status);
          if (aa !== ba) return aa ? -1 : 1;
          return aa ? apptWhen(a) - apptWhen(b) : apptWhen(b) - apptWhen(a);
        })
    );
  }, [appointments, filter, query]);

  const act = async (id, status) => {
    setBusyId(id);
    try {
      await onStatusUpdate(id, status);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      {showFilters && (
        <div className="manage-toolbar">
          <div className="search-box">
            <Search size={16} aria-hidden="true" />
            <input
              type="search"
              placeholder="Search patient, service or dentist"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search appointments"
            />
          </div>
          <div className="chip-row" role="group" aria-label="Filter by status">
            {FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                className={`chip ${filter === f ? "active" : ""}`}
                onClick={() => setFilter(f)}
              >
                {f} <span className="chip-count">{counts[f]}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {visible.length === 0 ? (
        <div className="empty-state">
          <p>{emptyText}</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Service</th>
                <th>Dentist</th>
                <th>Date and time</th>
                <th>Status</th>
                <th className="col-action">Action</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((appt) => (
                <tr key={appt._id}>
                  <td data-label="Patient">
                    <strong>{appt.patient?.user?.name || "—"}</strong>
                  </td>
                  <td data-label="Service">{appt.service?.name || "—"}</td>
                  <td data-label="Dentist">
                    {appt.dentist?.user?.name
                      ? dentistLabel(appt.dentist.user.name)
                      : "—"}
                  </td>
                  <td data-label="Date and time">
                    {formatDate(appt.appointmentDate)}
                    <span className="cell-sub">
                      {formatTime(appt.appointmentTime)}
                    </span>
                  </td>
                  <td data-label="Status">
                    <span
                      className={`status-badge status-${appt.status.toLowerCase()}`}
                    >
                      {appt.status}
                    </span>
                  </td>
                  <td data-label="Action" className="col-action">
                    {appt.status === "Pending" && (
                      <button
                        type="button"
                        className="btn-primary-sm sm"
                        disabled={busyId === appt._id}
                        onClick={() => act(appt._id, "Confirmed")}
                      >
                        Confirm
                      </button>
                    )}
                    {appt.status === "Confirmed" && (
                      <button
                        type="button"
                        className="btn-primary-sm sm"
                        disabled={busyId === appt._id}
                        onClick={() => act(appt._id, "Completed")}
                      >
                        Mark completed
                      </button>
                    )}
                    {!isActiveStatus(appt.status) && (
                      <span className="muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AppointmentsManager;

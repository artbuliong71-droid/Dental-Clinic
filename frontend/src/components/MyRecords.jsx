import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import NoteDetails from "./NoteDetails";
import {
  apptWhen,
  dentistLabel,
  formatDate,
  formatTime,
} from "../utils/dateUtils";
import "./manage.css";

/** Patient's own visit history (completed visits + the dentist's notes). */
const MyRecords = ({ appointments, notes }) => {
  const [openId, setOpenId] = useState(null);

  const notesById = useMemo(() => {
    const map = {};
    notes.forEach((n) => (map[String(n.appointment)] = n));
    return map;
  }, [notes]);

  const visits = appointments
    .filter((a) => a.status === "Completed")
    .sort((a, b) => apptWhen(b) - apptWhen(a));

  if (visits.length === 0) {
    return (
      <div className="empty-state">
        <p>
          No completed visits yet. Your treatment history will appear here after
          your appointments.
        </p>
      </div>
    );
  }

  return (
    <ul className="visit-list">
      {visits.map((a) => {
        const open = openId === a._id;
        return (
          <li key={a._id} className="visit">
            <button
              type="button"
              className="visit-head"
              aria-expanded={open}
              onClick={() => setOpenId(open ? null : a._id)}
              style={{
                width: "100%",
                background: "none",
                border: "none",
                textAlign: "left",
                cursor: "pointer",
                font: "inherit",
                color: "inherit",
                padding: 0,
              }}
            >
              <div>
                <strong>{a.service?.name}</strong>
                <span className="visit-meta">
                  {formatDate(a.appointmentDate)} at{" "}
                  {formatTime(a.appointmentTime)} ·{" "}
                  {dentistLabel(a.dentist?.user?.name)}
                </span>
              </div>
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="status-badge status-completed">Completed</span>
                {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </span>
            </button>

            {open && (
              <div className="visit-body">
                {a.reason && <p className="visit-meta">Reason: {a.reason}</p>}
                <NoteDetails note={notesById[String(a._id)]} />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
};

export default MyRecords;

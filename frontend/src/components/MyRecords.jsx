import { useMemo } from "react";
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
      {visits.map((a) => (
        <li key={a._id} className="visit">
          <div className="visit-head">
            <div>
              <strong>{a.service?.name}</strong>
              <span className="visit-meta">
                {formatDate(a.appointmentDate)} at{" "}
                {formatTime(a.appointmentTime)} ·{" "}
                {dentistLabel(a.dentist?.user?.name)}
              </span>
            </div>
            <span className="status-badge status-completed">Completed</span>
          </div>
          <div className="visit-body">
            <NoteDetails note={notesById[String(a._id)]} />
          </div>
        </li>
      ))}
    </ul>
  );
};

export default MyRecords;

import { formatDate } from "../utils/dateUtils";
import "./manage.css";

const NoteDetails = ({ note, showPrivate = false }) => {
  if (!note) return <p className="muted">No notes recorded for this visit.</p>;

  const rows = [
    ["Diagnosis", note.diagnosis],
    ["Treatment", note.treatment],
    ["Tooth number", note.toothNumber],
    ["Prescription", note.prescription],
    ["Follow-up", note.followUpDate ? formatDate(note.followUpDate) : ""],
  ].filter(([, v]) => v);

  return (
    <div>
      <dl className="info-grid">
        {rows.map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
      {showPrivate && note.internalNotes && (
        <div className="private-note">
          <strong>Private notes</strong>
          <p>{note.internalNotes}</p>
        </div>
      )}
    </div>
  );
};

export default NoteDetails;

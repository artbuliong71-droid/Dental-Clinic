import { useState } from "react";
import { todayStr } from "../utils/dateUtils";
import "./manage.css";

const toForm = (n) => ({
  diagnosis: n?.diagnosis || "",
  treatment: n?.treatment || "",
  toothNumber: n?.toothNumber || "",
  prescription: n?.prescription || "",
  followUpDate: n?.followUpDate ? String(n.followUpDate).slice(0, 10) : "",
  internalNotes: n?.internalNotes || "",
});

const ClinicalNoteForm = ({ note, onSave, onCancel, saving }) => {
  const [form, setForm] = useState(toForm(note));
  const [error, setError] = useState("");

  const change = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const submit = (e) => {
    e.preventDefault();
    if (!form.diagnosis.trim() && !form.treatment.trim()) {
      return setError("Enter a diagnosis or the treatment done.");
    }
    onSave(form);
  };

  return (
    <form onSubmit={submit} className="note-form" noValidate>
      <div className="form-grid">
        <div className="field field-wide">
          <label htmlFor="cn-diagnosis">Diagnosis</label>
          <textarea
            id="cn-diagnosis"
            name="diagnosis"
            maxLength={1000}
            value={form.diagnosis}
            onChange={change}
          />
        </div>
        <div className="field field-wide">
          <label htmlFor="cn-treatment">Treatment done</label>
          <textarea
            id="cn-treatment"
            name="treatment"
            maxLength={1000}
            value={form.treatment}
            onChange={change}
          />
        </div>
        <div className="field">
          <label htmlFor="cn-tooth">Tooth number(s)</label>
          <input
            id="cn-tooth"
            type="text"
            name="toothNumber"
            maxLength={50}
            placeholder="e.g. 36, 37"
            value={form.toothNumber}
            onChange={change}
          />
        </div>
        <div className="field">
          <label htmlFor="cn-follow">Follow-up date (optional)</label>
          <input
            id="cn-follow"
            type="date"
            name="followUpDate"
            min={todayStr()}
            value={form.followUpDate}
            onChange={change}
          />
        </div>
        <div className="field field-wide">
          <label htmlFor="cn-rx">Prescription</label>
          <textarea
            id="cn-rx"
            name="prescription"
            maxLength={1000}
            value={form.prescription}
            onChange={change}
          />
        </div>
        <div className="field field-wide">
          <label htmlFor="cn-private">
            Private notes (only you can see this)
          </label>
          <textarea
            id="cn-private"
            name="internalNotes"
            maxLength={1000}
            value={form.internalNotes}
            onChange={change}
          />
        </div>
      </div>
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
      <div className="form-actions record-actions">
        <button type="submit" className="btn-primary-sm" disabled={saving}>
          {saving ? "Saving..." : "Save notes"}
        </button>
        <button type="button" className="btn-ghost" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
};

export default ClinicalNoteForm;

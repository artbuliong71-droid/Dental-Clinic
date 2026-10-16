import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Printer } from "lucide-react";
import ClinicalNoteForm from "./ClinicalNoteForm";
import NoteDetails from "./NoteDetails";
import { getPatientRecord, saveClinicalNote } from "../api/recordsApi";
import {
  apptWhen,
  dentistLabel,
  formatDate,
  formatTime,
} from "../utils/dateUtils";
import "./manage.css";

const ageOf = (birthdate) => {
  if (!birthdate) return null;
  const b = new Date(birthdate);
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getUTCDate())) age--;
  return age;
};

const CAN_ADD_NOTE = ["Confirmed", "Completed"];
const GENDER = {
  male: "Male",
  female: "Female",
  other: "Other",
  prefer_not_to_say: "Prefer not to say",
};

/** Admin view of one patient: contact, personal info (read-only), and visit history with clinical notes. */
const PatientRecord = ({ patient, appointments, onBack }) => {
  const [profile, setProfile] = useState(null);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [noteFor, setNoteFor] = useState(null);
  const [savingNote, setSavingNote] = useState(false);

  const load = async () => {
    try {
      const res = await getPatientRecord(patient._id);
      setProfile(res.data.profile);
      setNotes(res.data.notes);
    } catch (err) {
      setError("Failed to load the patient record.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    load();
  }, [patient._id]);

  const visits = useMemo(
    () =>
      appointments
        .filter((a) => {
          const pid =
            a.patient && typeof a.patient === "object"
              ? a.patient._id
              : a.patient;
          return pid === patient.patientId;
        })
        .sort((a, b) => apptWhen(b) - apptWhen(a)),
    [appointments, patient.patientId],
  );

  const notesById = useMemo(() => {
    const map = {};
    notes.forEach((n) => (map[String(n.appointment)] = n));
    return map;
  }, [notes]);

  const handleSaveNote = async (appointmentId, data) => {
    setError("");
    setMessage("");
    setSavingNote(true);
    try {
      await saveClinicalNote(appointmentId, {
        ...data,
        patientUserId: patient._id,
      });
      await load();
      setNoteFor(null);
      setMessage("Clinical notes saved.");
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to save the clinical notes.",
      );
    } finally {
      setSavingNote(false);
    }
  };

  const age = ageOf(profile?.birthdate);
  const hasInfo = !!profile && Object.values(profile).some(Boolean);

  return (
    <div>
      <div className="print-only">
        <h2>Germino Dental Clinic: Patient Record</h2>
      </div>

      <div className="record-head">
        <div>
          <h2>{patient.name}</h2>
          <p className="page-sub">
            {patient.email}
            {patient.phone ? ` · ${patient.phone}` : ""}
          </p>
        </div>
        <div className="record-actions no-print">
          <button type="button" className="btn-ghost" onClick={onBack}>
            <ArrowLeft size={16} /> Back
          </button>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => window.print()}
          >
            <Printer size={16} /> Print
          </button>
        </div>
      </div>

      {error && (
        <p className="error-message banner" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="success-message banner" role="status">
          {message}
        </p>
      )}

      {loading ? (
        <p className="muted">Loading record...</p>
      ) : (
        <>
          <section className="form-section">
            <div className="section-head">
              <h3>Patient information</h3>
            </div>

            {!hasInfo ? (
              <p className="muted">
                The patient hasn't filled in their personal details yet.
              </p>
            ) : (
              <dl className="info-grid">
                <div>
                  <dt>Birthdate</dt>
                  <dd>
                    {profile.birthdate
                      ? `${formatDate(profile.birthdate)}${age !== null ? ` (${age} yrs)` : ""}`
                      : "—"}
                  </dd>
                </div>
                <div>
                  <dt>Gender</dt>
                  <dd>{GENDER[profile.gender] || "—"}</dd>
                </div>
                <div className="info-wide">
                  <dt>Address</dt>
                  <dd>{profile.address || "—"}</dd>
                </div>
              </dl>
            )}
          </section>

          <h3 className="group-title">Visit history ({visits.length})</h3>
          {visits.length === 0 ? (
            <div className="empty-state">
              <p>No visits yet.</p>
            </div>
          ) : (
            <ul className="visit-list">
              {visits.map((a) => {
                const note = notesById[String(a._id)];
                return (
                  <li key={a._id} className="visit">
                    <div className="visit-head">
                      <div>
                        <strong>{a.service?.name}</strong>
                        <span className="visit-meta">
                          {formatDate(a.appointmentDate)} at{" "}
                          {formatTime(a.appointmentTime)} ·{" "}
                          {dentistLabel(a.dentist?.user?.name)}
                        </span>
                        {a.reason && (
                          <span className="visit-meta">Reason: {a.reason}</span>
                        )}
                      </div>
                      <span
                        className={`status-badge status-${a.status.toLowerCase()}`}
                      >
                        {a.status}
                      </span>
                    </div>

                    {noteFor === a._id ? (
                      <div className="visit-body">
                        <ClinicalNoteForm
                          note={note}
                          saving={savingNote}
                          onSave={(data) => handleSaveNote(a._id, data)}
                          onCancel={() => setNoteFor(null)}
                        />
                      </div>
                    ) : (
                      <>
                        {note && (
                          <div className="visit-body">
                            <NoteDetails note={note} showPrivate />
                          </div>
                        )}
                        {CAN_ADD_NOTE.includes(a.status) && (
                          <div className="visit-actions no-print">
                            <button
                              type="button"
                              className="btn-ghost"
                              onClick={() => setNoteFor(a._id)}
                            >
                              {note
                                ? "Edit clinical notes"
                                : "Add clinical notes"}
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </div>
  );
};

export default PatientRecord;

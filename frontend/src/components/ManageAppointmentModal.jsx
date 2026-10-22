// src/components/ManageAppointmentModal.jsx
import { useEffect, useState } from "react";
import { CalendarClock, XCircle, Info } from "lucide-react";
import {
  getAvailableSlots,
  rescheduleAppointment,
  cancelAppointment,
} from "../api/appointmentsApi";
import { closedInfo } from "../utils/closedDays";

const WRONG_SERVICE = "Wrong service selected";
const RESCHEDULE_REASONS = [
  "Schedule conflict",
  WRONG_SERVICE,
  "Not feeling well",
  "Other",
];
const CANCEL_REASONS = [
  WRONG_SERVICE,
  "Schedule conflict",
  "No longer needed",
  "Found another clinic",
  "Other",
];

/* ---------- small helpers ---------- */
const todayStr = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};
const nowTimeStr = () => new Date().toTimeString().slice(0, 5);
const dateKey = (v) => String(v).slice(0, 10);
const fmtDate = (v) =>
  new Date(`${dateKey(v)}T00:00:00`).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
const fmtTime = (t) => {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
};
const peso = (n) => `₱${Number(n).toLocaleString()}`;

/**
 * Lets the patient reschedule (new date/time and/or service) or cancel.
 * Both need a reason.
 */
const ManageAppointmentModal = ({
  appointment,
  services,
  closedDates,
  onClose,
  onDone,
}) => {
  const currentDate = dateKey(appointment.appointmentDate);
  const currentTime = appointment.appointmentTime;
  const currentServiceId = appointment.service?._id;
  const dentistId = appointment.dentist?._id;

  const [mode, setMode] = useState("reschedule");
  const [reasonChoice, setReasonChoice] = useState("");
  const [details, setDetails] = useState("");
  const [serviceId, setServiceId] = useState(currentServiceId || "");
  const [date, setDate] = useState(currentDate);
  const [time, setTime] = useState(currentTime);
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const reasons = mode === "cancel" ? CANCEL_REASONS : RESCHEDULE_REASONS;

  // Close with the Escape key
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, saving]);

  // Available times for the chosen date (only needed when rescheduling)
  useEffect(() => {
    if (mode !== "reschedule" || !dentistId || !date) return;
    let cancelled = false;
    setSlotsLoading(true);
    getAvailableSlots(dentistId, date)
      .then((res) => {
        if (cancelled) return;
        let list = res.data;
        if (date === todayStr()) list = list.filter((t) => t > nowTimeStr());
        // The patient's own slot counts as free for them
        const ownSlotStillValid =
          date === currentDate &&
          (date !== todayStr() || currentTime > nowTimeStr());
        if (ownSlotStillValid && !list.includes(currentTime)) {
          list = [...list, currentTime].sort();
        }
        setSlots(list);
        setTime((prev) => (list.includes(prev) ? prev : ""));
      })
      .catch(() => {
        if (!cancelled) setSlots([]);
      })
      .finally(() => {
        if (!cancelled) setSlotsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [mode, dentistId, date, currentDate, currentTime]);

  const switchMode = (next) => {
    setMode(next);
    setError("");
    const list = next === "cancel" ? CANCEL_REASONS : RESCHEDULE_REASONS;
    if (!list.includes(reasonChoice)) setReasonChoice("");
  };

  const handleDate = (e) => {
    const value = e.target.value;
    if (value) {
      const info = closedInfo(value, closedDates);
      if (info) {
        setError(
          `The clinic is closed on ${fmtDate(value)} (${info.reason}). Please pick another date.`,
        );
        return;
      }
    }
    setError("");
    setDate(value);
    setTime("");
  };

  const finalReason = () => {
    const d = details.trim();
    if (reasonChoice === "Other") return d;
    return d ? `${reasonChoice} - ${d}` : reasonChoice;
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (!reasonChoice) return setError("Please choose a reason.");
    if (reasonChoice === "Other" && !details.trim())
      return setError("Please tell us your reason.");
    const reason = finalReason();

    if (mode === "reschedule") {
      if (!date) return setError("Please pick a date.");
      if (!time) return setError("Please pick an available time.");
      if (
        date === currentDate &&
        time === currentTime &&
        serviceId === currentServiceId
      ) {
        return setError(
          "Nothing changed yet. Pick a new date, time or service.",
        );
      }
    }

    setSaving(true);
    try {
      if (mode === "cancel") {
        await cancelAppointment(appointment._id, reason);
        onDone("Your appointment was cancelled.");
      } else {
        await rescheduleAppointment(appointment._id, {
          appointmentDate: date,
          appointmentTime: time,
          service: serviceId,
          rescheduleReason: reason,
        });
        onDone(
          "Your appointment was updated. The clinic will confirm the new schedule.",
        );
      }
    } catch (err) {
      const list = err.response?.data?.errors;
      setError(
        list && list.length > 0
          ? list.map((x) => x.message).join(", ")
          : err.response?.data?.message ||
              "Something went wrong. Please try again.",
      );
      setSaving(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="manage-title"
      >
        <h3 id="manage-title">Change your appointment</h3>
        <p className="modal-current">
          {appointment.service?.name} · {fmtDate(appointment.appointmentDate)}{" "}
          at {fmtTime(appointment.appointmentTime)}
        </p>

        <div
          className="choice-grid"
          role="radiogroup"
          aria-label="What would you like to do?"
        >
          <label
            className={`choice-card ${mode === "reschedule" ? "selected" : ""}`}
          >
            <input
              type="radio"
              name="manage-mode"
              className="sr-only"
              checked={mode === "reschedule"}
              onChange={() => switchMode("reschedule")}
            />
            <CalendarClock size={20} aria-hidden="true" />
            <span>
              <strong>Reschedule</strong>
              <small>New date, time or service</small>
            </span>
          </label>
          <label
            className={`choice-card danger ${mode === "cancel" ? "selected" : ""}`}
          >
            <input
              type="radio"
              name="manage-mode"
              className="sr-only"
              checked={mode === "cancel"}
              onChange={() => switchMode("cancel")}
            />
            <XCircle size={20} aria-hidden="true" />
            <span>
              <strong>Cancel appointment</strong>
              <small>You won't be booked anymore</small>
            </span>
          </label>
        </div>

        <form onSubmit={submit} noValidate>
          {error && (
            <p className="error-message" role="alert">
              {error}
            </p>
          )}

          <div className="field">
            <label htmlFor="manage-reason">
              {mode === "cancel"
                ? "Why are you cancelling?"
                : "Why are you rescheduling?"}
            </label>
            <select
              id="manage-reason"
              value={reasonChoice}
              onChange={(e) => setReasonChoice(e.target.value)}
            >
              <option value="">Select a reason</option>
              {reasons.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className="field" style={{ marginTop: "0.8rem" }}>
            <label htmlFor="manage-details">
              {reasonChoice === "Other"
                ? "Tell us your reason"
                : "More details (optional)"}
            </label>
            <textarea
              id="manage-details"
              maxLength={200}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="e.g. I have a meeting at that time"
            />
          </div>

          {mode === "cancel" && reasonChoice === WRONG_SERVICE && (
            <div className="modal-hint">
              <Info size={18} aria-hidden="true" />
              <span>
                Booked the wrong service? You don't have to cancel.{" "}
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => switchMode("reschedule")}
                >
                  Change the service instead
                </button>
              </span>
            </div>
          )}

          {mode === "reschedule" && (
            <div className="modal-fields">
              <div className="field">
                <label htmlFor="manage-service">Service</label>
                <select
                  id="manage-service"
                  value={serviceId}
                  onChange={(e) => setServiceId(e.target.value)}
                >
                  {services.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name} ({peso(s.price)})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-grid">
                <div className="field">
                  <label htmlFor="manage-date">New date</label>
                  <input
                    id="manage-date"
                    type="date"
                    min={todayStr()}
                    value={date}
                    onChange={handleDate}
                  />
                </div>
                <div className="field">
                  <label htmlFor="manage-time">New time</label>
                  <select
                    id="manage-time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    disabled={!date || slotsLoading}
                  >
                    <option value="">
                      {!date
                        ? "Pick a date first"
                        : slotsLoading
                          ? "Loading..."
                          : slots.length === 0
                            ? "No available time"
                            : "Select a time"}
                    </option>
                    {slots.map((t) => (
                      <option key={t} value={t}>
                        {fmtTime(t)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="form-hint">
                After you reschedule, the clinic will confirm the new schedule
                again.
              </p>
            </div>
          )}

          <div className="modal-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={saving}
            >
              Keep appointment
            </button>
            {mode === "cancel" ? (
              <button type="submit" className="btn-danger" disabled={saving}>
                {saving ? "Cancelling..." : "Cancel appointment"}
              </button>
            ) : (
              <button
                type="submit"
                className="btn-primary-sm"
                disabled={saving}
              >
                {saving ? "Saving..." : "Confirm reschedule"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManageAppointmentModal;

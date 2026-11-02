import { useEffect, useState } from "react";
import { Search, UserRound, UserPlus } from "lucide-react";
import {
  searchWalkInPatients,
  createWalkInAppointment,
  registerWalkInPatient,
} from "../api/walkInApi";
import { getAvailableSlots } from "../api/appointmentsApi";
import { dentistLabel, formatTime } from "../utils/dateUtils";
import "./manage.css";
import "./walkIn.css";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const NAME_REGEX = /^\p{L}{2,}(\s+\p{L}{2,})+$/u;
const PHONE_REGEX = /^09\d{9}$/;

const todayStr = () => {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
};

const emptyForm = {
  service: "",
  dentist: "",
  date: todayStr(),
  time: "",
};
const emptyReg = { name: "", email: "", phone: "" };

const validateReg = ({ name, email, phone }) => {
  const errors = {};
  if (!name.trim()) errors.name = "Full name is required.";
  else if (!NAME_REGEX.test(name.trim()))
    errors.name = "Enter the full name (first and last name, letters only).";
  if (!email.trim()) errors.email = "Email is required.";
  else if (!EMAIL_REGEX.test(email.trim()))
    errors.email = "Enter a valid email, like name@example.com.";
  if (!phone) errors.phone = "Phone number is required.";
  else if (!PHONE_REGEX.test(phone))
    errors.phone = "Phone number must be 11 digits and start with 09.";
  return errors;
};

const WalkInView = ({ services = [], dentists = [], onBooked }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [slots, setSlots] = useState([]);
  const [slotMsg, setSlotMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Register a new patient
  const [showRegister, setShowRegister] = useState(false);
  const [reg, setReg] = useState(emptyReg);
  const [regErrors, setRegErrors] = useState({});
  const [regSaving, setRegSaving] = useState(false);

  // Naglo-load agad pagbukas, at nagfi-filter habang nagta-type
  useEffect(() => {
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await searchWalkInPatients(query.trim());
        setResults(res.data);
        setError("");
      } catch (err) {
        setResults([]);
        setError(err.response?.data?.message || "Could not load patients.");
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query, reloadKey]);

  const handleSearch = (e) => e.preventDefault();
  const loadSlots = async (dentist, date) => {
    setSlots([]);
    setSlotMsg("");
    if (!dentist || !date) return;
    try {
      const res = await getAvailableSlots(dentist, date);
      if (res.closed) setSlotMsg(`Clinic is closed (${res.reason}).`);
      else if (res.data.length === 0) setSlotMsg("No available slots.");
      setSlots(res.data);
    } catch {
      setSlotMsg("Could not load time slots.");
    }
  };

  const change = (field, value) => {
    const next = { ...form, [field]: value };
    if (field === "dentist" || field === "date") next.time = "";
    setForm(next);
    if (field === "dentist" || field === "date") {
      loadSlots(next.dentist, next.date);
    }
  };

  const openForm = (p) => {
    // Isa lang ang dentist? Piliin na agad
    const onlyDentist = dentists.length === 1 ? dentists[0]._id : "";
    const next = { ...emptyForm, date: todayStr(), dentist: onlyDentist };

    setSelected(p);
    setForm(next);
    setSlots([]);
    setSlotMsg("");
    setError("");
    setSuccess("");
    if (onlyDentist) loadSlots(onlyDentist, next.date);
  };

  /* ---------- Register a new patient ---------- */
  const openRegister = () => {
    // Kung pangalan ang tinype sa search, ilagay na sa form
    const prefill = /^[\p{L}\s]+$/u.test(query.trim()) ? query.trim() : "";
    setReg({ ...emptyReg, name: prefill });
    setRegErrors({});
    setSelected(null);
    setError("");
    setSuccess("");
    setShowRegister(true);
  };

  const handleRegChange = (e) => {
    let { name, value } = e.target;
    if (name === "phone") value = value.replace(/\D/g, "").slice(0, 11);
    setReg({ ...reg, [name]: value });
    if (regErrors[name]) setRegErrors({ ...regErrors, [name]: "" });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    const errors = validateReg(reg);
    setRegErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setRegSaving(true);
    try {
      const res = await registerWalkInPatient({
        name: reg.name.trim(),
        email: reg.email.trim(),
        phone: reg.phone,
      });
      setShowRegister(false);
      setReg(emptyReg);
      setQuery("");
      setReloadKey((k) => k + 1);
      openForm(res.data); // diretso sa pag-book
      setSuccess(
        `${res.data.name} was registered. Continue booking the walk-in below.`,
      );
    } catch (err) {
      setError(
        err.response?.data?.message || "Could not register the patient.",
      );
    } finally {
      setRegSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await createWalkInAppointment({
        patientId: selected.patientId,
        dentist: form.dentist,
        service: form.service,
        appointmentDate: form.date,
        appointmentTime: form.time,
      });
      setSuccess(`Walk-in appointment recorded for ${selected.name}.`);
      setSelected(null);
      setForm(emptyForm);
      if (onBooked) await onBooked();
    } catch (err) {
      setError(err.response?.data?.message || "Could not record appointment.");
    } finally {
      setSaving(false);
    }
  };

  const activeServices = services.filter((s) => s.isActive !== false);

  return (
    <div>
      <h2>Walk-in Patients</h2>
      <p className="muted">
        Search for the patient's account, then record their visit. No account
        yet? Register them first.
      </p>

      <form className="manage-toolbar" onSubmit={handleSearch}>
        <div className="search-box">
          <Search size={16} aria-hidden="true" />
          <input
            type="search"
            placeholder="Search by name, email or phone number"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search patients"
          />
        </div>
        <button
          type="submit"
          className="btn-primary-sm"
          disabled={searching || query.trim().length < 2}
        >
          {searching ? "Searching..." : "Search"}
        </button>
        <button type="button" className="btn-ghost" onClick={openRegister}>
          <UserPlus size={16} aria-hidden="true" /> Register new patient
        </button>
      </form>

      {error && (
        <p className="walkin-error" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p className="walkin-success" role="status">
          {success}
        </p>
      )}

      {showRegister && (
        <form className="walkin-form" onSubmit={handleRegister} noValidate>
          <h3>
            <UserPlus size={18} aria-hidden="true" /> Register a new patient
          </h3>
          <p className="muted">
            The patient can set their own password later using "Forgot password"
            with this email.
          </p>

          <label>
            Full name
            <input
              name="name"
              type="text"
              placeholder="e.g. Juan Dela Cruz"
              value={reg.name}
              onChange={handleRegChange}
              aria-invalid={!!regErrors.name}
            />
            {regErrors.name && (
              <small className="walkin-error" role="alert">
                {regErrors.name}
              </small>
            )}
          </label>

          <label>
            Email
            <input
              name="email"
              type="email"
              placeholder="name@example.com"
              value={reg.email}
              onChange={handleRegChange}
              aria-invalid={!!regErrors.email}
            />
            {regErrors.email && (
              <small className="walkin-error" role="alert">
                {regErrors.email}
              </small>
            )}
          </label>

          <label>
            Phone number
            <input
              name="phone"
              type="tel"
              inputMode="numeric"
              placeholder="09XXXXXXXXX"
              value={reg.phone}
              onChange={handleRegChange}
              aria-invalid={!!regErrors.phone}
            />
            {regErrors.phone && (
              <small className="walkin-error" role="alert">
                {regErrors.phone}
              </small>
            )}
          </label>

          <div className="walkin-actions">
            <button
              type="button"
              className="chip"
              onClick={() => setShowRegister(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary-sm"
              disabled={regSaving}
            >
              {regSaving ? "Registering..." : "Register and continue"}
            </button>
          </div>
        </form>
      )}

      {!searching && results.length === 0 && (
        <div className="empty-state">
          <p>
            {query.trim()
              ? "No patient account found. Use “Register new patient” above."
              : "No registered patients yet."}
          </p>
        </div>
      )}
      {results.length > 0 && (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Full name</th>
                <th>Email</th>
                <th>Phone</th>
                <th className="col-action">Action</th>
              </tr>
            </thead>
            <tbody>
              {results.map((p) => (
                <tr key={p.patientId}>
                  <td data-label="Full name">
                    <strong>{p.name}</strong>
                  </td>
                  <td data-label="Email">{p.email}</td>
                  <td data-label="Phone">{p.phone || "—"}</td>
                  <td data-label="Action" className="col-action">
                    <button
                      type="button"
                      className="btn-primary-sm sm"
                      onClick={() => {
                        setShowRegister(false);
                        openForm(p);
                      }}
                    >
                      Book walk-in
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <form className="walkin-form" onSubmit={handleSubmit}>
          <h3>
            <UserRound size={18} aria-hidden="true" /> {selected.name}
          </h3>
          <p className="muted">
            {selected.email} · {selected.phone || "no phone"}
          </p>

          <label>
            Service
            <select
              required
              value={form.service}
              onChange={(e) => change("service", e.target.value)}
            >
              <option value="">Select a service</option>
              {activeServices.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                  {s.price != null ? ` — ₱${s.price}` : ""}
                </option>
              ))}
            </select>
          </label>

          <label>
            Dentist
            <select
              required
              value={form.dentist}
              onChange={(e) => change("dentist", e.target.value)}
            >
              <option value="">Select a dentist</option>
              {dentists.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.user?.name ? dentistLabel(d.user.name) : d._id}
                </option>
              ))}
            </select>
          </label>

          <label>
            Date
            <input
              type="date"
              required
              min={todayStr()}
              value={form.date}
              onChange={(e) => change("date", e.target.value)}
            />
          </label>

          <label>
            Time
            <select
              required
              value={form.time}
              onChange={(e) => change("time", e.target.value)}
              disabled={slots.length === 0}
            >
              <option value="">
                {form.dentist ? "Select a time" : "Choose a dentist first"}
              </option>
              {slots.map((t) => (
                <option key={t} value={t}>
                  {formatTime(t)}
                </option>
              ))}
            </select>
            {slotMsg && <small className="muted">{slotMsg}</small>}
          </label>

          <div className="walkin-actions">
            <button
              type="button"
              className="chip"
              onClick={() => setSelected(null)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary-sm"
              disabled={saving || !form.time}
            >
              {saving ? "Saving..." : "Book appointment"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default WalkInView;
